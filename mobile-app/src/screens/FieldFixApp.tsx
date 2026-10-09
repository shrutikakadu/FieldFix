import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Platform, Pressable, SafeAreaView, ScrollView,
  StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import type { Socket } from 'socket.io-client';
import {
  clearAuthToken, createPaymentOrder, failPayment, getAuthToken, getBookings,
  getHealthCheck, getMe, getMessages, login, postMessage, register, saveAuthToken, updateAvailability,
  registerPushToken, unregisterPushToken, updateBookingStatus, User, verifyPayment,
} from '../services/api';
import { connectSocket } from '../services/socket';
import { openCheckout } from '../services/razorpay';
import LocationMap from '../components/LocationMap';

const SERVICES = ['AC & Cooling', 'Electrical', 'Plumbing', 'Appliances', 'Cleaning', 'Carpentry', 'Painting', 'Pest Control', 'Smart Home', 'Geyser & Water'];
const SKILLS = SERVICES;
type Coords = { latitude: number; longitude: number };
type Booking = { id: string; status: string; service: string; address: string; description: string; scheduledAt: string; amount: number; paymentStatus: string; technicianName: string; technicianId: string; customerName?: string };

const alertUser = (title: string, message: string) => Alert.alert(title, message);
const formatDate = (value: string) => new Date(value).toLocaleString();

export default function FieldFixApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverUp, setServerUp] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authRole, setAuthRole] = useState<'CUSTOMER' | 'TECHNICIAN'>('CUSTOMER');
  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', password: '', technicianVerifiedId: '', city: 'Bangalore' });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [service, setService] = useState(SERVICES[0]);
  const [city, setCity] = useState('Bangalore');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [coords, setCoords] = useState<Coords | null>(null);
  const [bookingBusy, setBookingBusy] = useState(false);
  const [available, setAvailable] = useState(Boolean(user?.technicianProfile?.isAvailable));
  const [activeTab, setActiveTab] = useState<'JOBS' | 'BOOK'>('JOBS');
  const [notifications, setNotifications] = useState<string[]>([]);
  const [chatBooking, setChatBooking] = useState<Booking | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [pushToken, setPushToken] = useState('');
  const [liveLocations, setLiveLocations] = useState<Record<string, Coords>>({});
  const activeJobKey = useMemo(() => bookings.filter(booking => ['ACCEPTED', 'DISPATCHED', 'IN_PROGRESS'].includes(booking.status)).map(booking => booking.id).sort().join(','), [bookings]);

  const refreshBookings = useCallback(async () => {
    try { setBookings(await getBookings()); } catch { /* Keep the last successful snapshot while offline. */ }
  }, []);

  const finishLogin = useCallback(async (token: string, signedInUser?: User) => {
    await saveAuthToken(token);
    const profile = signedInUser || await getMe();
    setUser(profile);
    setAvailable(Boolean(profile.technicianProfile?.isAvailable));
    const activeSocket = connectSocket(token);
    socketRef.current?.disconnect();
    socketRef.current = activeSocket;
    setSocket(activeSocket);
    if (profile.role !== 'ADMIN') await refreshBookings();
  }, [refreshBookings]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setServerUp(Boolean(await getHealthCheck()));
        const token = await getAuthToken();
        if (token) {
          const profile = await getMe();
          if (mounted) await finishLogin(token, profile);
        }
      } catch {
        await clearAuthToken();
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; socketRef.current?.disconnect(); };
  }, [finishLogin]);

  useEffect(() => {
    if (!user) return;
    void refreshBookings();
    const timer = setInterval(() => { void refreshBookings(); }, 12000);
    return () => clearInterval(timer);
  }, [user, refreshBookings]);

  useEffect(() => {
    if (!user || user.role === 'ADMIN' || Platform.OS === 'web') return;
    let active = true;
    let received: ReturnType<typeof Notifications.addNotificationReceivedListener> | undefined;
    (async () => {
      try {
        if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('default', { name: 'Booking updates', importance: Notifications.AndroidImportance.DEFAULT });
        let permissions = await Notifications.getPermissionsAsync();
        if (permissions.status !== 'granted') permissions = await Notifications.requestPermissionsAsync();
        if (permissions.status !== 'granted') return;
        const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
        if (!projectId) return;
        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        if (!active) return;
        await registerPushToken(token, Platform.OS as 'ios' | 'android');
        if (active) setPushToken(token);
      } catch (error) { console.warn('[Notifications] Push setup was unavailable:', error); }
    })();
    received = Notifications.addNotificationReceivedListener(notification => {
      const message = notification.request.content.body || 'You have a FieldFix update.';
      setNotifications(old => [message, ...old.filter(existing => existing !== message)].slice(0, 4));
      void refreshBookings();
    });
    return () => { active = false; received?.remove(); };
  }, [user, refreshBookings]);

  useEffect(() => {
    if (!socket) return;
    const onNotification = (notification: { message?: string }) => {
      const message = notification.message || 'Your booking has an update.';
      setNotifications(old => [message, ...old.filter(existing => existing !== message)].slice(0, 4));
      void refreshBookings();
    };
    socket.on('notification:new', onNotification);
    return () => { socket.off('notification:new', onNotification); };
  }, [socket, refreshBookings]);

  useEffect(() => {
    if (!socket || !user) return;
    const activeJobs = bookings.filter(booking => ['ACCEPTED', 'DISPATCHED', 'IN_PROGRESS'].includes(booking.status));
    const joinRooms = () => activeJobs.forEach(booking => socket.emit('booking:join', booking.id));
    const onLocation = (data: { bookingId: string; lat: number; lng: number }) => {
      setLiveLocations(old => ({ ...old, [data.bookingId]: { latitude: data.lat, longitude: data.lng } }));
    };
    socket.on('connect', joinRooms);
    socket.on('location:live', onLocation);
    if (socket.connected) joinRooms();
    let cancelled = false;
    let watcher: Location.LocationSubscription | undefined;
    if (user.role === 'TECHNICIAN' && activeJobs.length) {
      void (async () => {
        try {
          const permission = await Location.requestForegroundPermissionsAsync();
          if (!permission.granted || cancelled) return;
          watcher = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 25 }, position => {
            const point = { latitude: position.coords.latitude, longitude: position.coords.longitude };
            for (const booking of activeJobs) socket.emit('location:update', { bookingId: booking.id, lat: point.latitude, lng: point.longitude });
            setLiveLocations(old => activeJobs.reduce((next, booking) => ({ ...next, [booking.id]: point }), old));
          });
          if (cancelled) watcher.remove();
        } catch (error) { console.warn('[Location] Live technician tracking is unavailable:', error); }
      })();
    }
    return () => { cancelled = true; watcher?.remove(); socket.off('connect', joinRooms); socket.off('location:live', onLocation); };
  }, [socket, user, activeJobKey]);

  useEffect(() => {
    if (!socket || !chatBooking) return;
    const threadId = `booking:${chatBooking.id}`;
    socket.emit('chat:join', threadId);
    let active = true;
    const loadMessages = async () => {
      try { const result = await getMessages(threadId); if (active) setChatMessages(result); }
      catch { if (active) setChatMessages([]); }
    };
    const onMessage = (message: any) => {
      if (message.threadId === threadId) setChatMessages(old => old.some(item => item.id === message.id) ? old : [...old, message]);
    };
    void loadMessages();
    const timer = setInterval(() => { void loadMessages(); }, 8000);
    socket.on('chat:message', onMessage);
    return () => { active = false; clearInterval(timer); socket.off('chat:message', onMessage); };
  }, [socket, chatBooking]);

  const onAuthSubmit = async () => {
    setAuthError(''); setAuthBusy(true);
    try {
      if (authMode === 'LOGIN') {
        const result = await login(authForm.email, authForm.password);
        if (result.user.role === 'ADMIN') throw new Error('Admin accounts use the web dashboard.');
        await finishLogin(result.token, result.user);
      } else {
        const result = await register({
          name: authForm.name, email: authForm.email, phone: authForm.phone,
          password: authForm.password, role: authRole,
          ...(authRole === 'TECHNICIAN' ? {
            technicianVerifiedId: authForm.technicianVerifiedId,
            skills: selectedSkills,
            city: authForm.city,
          } : {}),
        });
        await finishLogin(result.token, result.user);
      }
    } catch (error: any) {
      setAuthError(error?.response?.data?.message || error?.message || 'Could not sign in. Check your details and try again.');
    } finally { setAuthBusy(false); }
  };

  const signOut = async () => {
    socketRef.current?.disconnect(); socketRef.current = null; setSocket(null);
    if (pushToken) { try { await unregisterPushToken(pushToken); } catch { /* The session is still safe to close if offline. */ } }
    setPushToken('');
    await clearAuthToken(); setUser(null); setBookings([]);
  };

  const useMyLocation = async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) return alertUser('Location permission needed', 'Allow location access to place your booking on the map. You can still enter the address manually.');
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    } catch { alertUser('Location unavailable', 'Enter the service address manually and try location again later.'); }
  };

  const submitBooking = async () => {
    if (!address.trim() || !city.trim()) return alertUser('Add booking details', 'Enter the service address and city.');
    const appointment = new Date(`${appointmentDate}T10:00:00`);
    if (Number.isNaN(appointment.getTime()) || appointment <= new Date()) return alertUser('Choose a future date', 'The appointment date must be in the future.');
    setBookingBusy(true);
    let order: any;
    let checkoutCompleted = false;
    try {
      order = await createPaymentOrder({
        service, city: city.trim(), address: address.trim(), scheduledAt: appointment.toISOString(),
        description: description.trim(), latitude: coords?.latitude ?? 12.9716, longitude: coords?.longitude ?? 77.5946,
      });
      const checkoutResult = await openCheckout({
        key_id: order.keyId,
        order_id: order.orderId,
        amount: String(order.amount),
        currency: order.currency,
        name: 'FieldFix',
        description: `${service} service booking`,
        prefill: { name: user?.name, email: user?.email, contact: user?.phone },
        theme: { color: '#285d46' },
      });
      checkoutCompleted = true;
      await verifyPayment({
        bookingId: order.bookingId,
        orderId: order.orderId,
        paymentId: checkoutResult.razorpay_payment_id,
        signature: checkoutResult.razorpay_signature,
      });
      await refreshBookings();
      setActiveTab('JOBS');
      setAddress(''); setDescription('');
      alertUser('Booking confirmed', `Your paid ${service} booking is assigned to ${order.technician?.name || 'a technician'}.`);
    } catch (error: any) {
      if (!checkoutCompleted && order?.bookingId && order?.orderId) {
        try { await failPayment(order.bookingId, order.orderId); } catch { /* Preserve the original checkout error. */ }
      }
      alertUser('Booking not completed', error?.response?.data?.message || error?.message || 'Please try again.');
    } finally { setBookingBusy(false); }
  };

  const setTechnicianAvailability = async (value: boolean) => {
    try { await updateAvailability(value); setAvailable(value); }
    catch (error: any) { alertUser('Could not update availability', error?.response?.data?.message || 'Please try again.'); }
  };

  const sendChatMessage = async () => {
    if (!chatBooking || !chatInput.trim()) return;
    setChatBusy(true);
    try {
      const message = await postMessage(`booking:${chatBooking.id}`, chatInput.trim());
      setChatMessages(old => old.some(item => item.id === message.id) ? old : [...old, message]);
      setChatInput('');
    } catch (error: any) { alertUser('Message not sent', error?.response?.data?.message || 'Check your connection and try again.'); }
    finally { setChatBusy(false); }
  };

  const transition = useMemo<Record<string, string>>(() => ({ PENDING: 'ACCEPTED', ACCEPTED: 'IN_PROGRESS', IN_PROGRESS: 'COMPLETED' }), []);
  const advanceJob = async (booking: Booking) => {
    const next = transition[booking.status];
    if (!next) return;
    try { await updateBookingStatus(booking.id, next); await refreshBookings(); }
    catch (error: any) { alertUser('Could not update job', error?.response?.data?.message || 'Please try again.'); }
  };

  if (loading) return <Centered><ActivityIndicator size="large" color="#285d46" /><Text style={styles.muted}>Connecting to FieldFix…</Text></Centered>;

  if (!user) return (
    <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.authWrap} keyboardShouldPersistTaps="handled">
      <Text style={styles.brand}>⚡ FieldFix</Text>
      <Text style={styles.heading}>{authMode === 'LOGIN' ? 'Welcome back' : 'Create your account'}</Text>
      <Text style={styles.muted}>{serverUp ? 'Connected to the FieldFix API' : 'API offline — check your server URL and try again'}</Text>
      {authMode === 'REGISTER' && <View style={styles.row}>
        <Choice active={authRole === 'CUSTOMER'} label="Customer" onPress={() => setAuthRole('CUSTOMER')} />
        <Choice active={authRole === 'TECHNICIAN'} label="Technician" onPress={() => setAuthRole('TECHNICIAN')} />
      </View>}
      {authMode === 'REGISTER' && <Field label="Full name" value={authForm.name} onChangeText={(value: string) => setAuthForm({ ...authForm, name: value })} />}
      <Field label="Email" autoCapitalize="none" keyboardType="email-address" value={authForm.email} onChangeText={(value: string) => setAuthForm({ ...authForm, email: value })} />
      {authMode === 'REGISTER' && <Field label="Phone" keyboardType="phone-pad" value={authForm.phone} onChangeText={(value: string) => setAuthForm({ ...authForm, phone: value })} />}
      <Field label="Password" secureTextEntry value={authForm.password} onChangeText={(value: string) => setAuthForm({ ...authForm, password: value })} />
      {authMode === 'REGISTER' && authRole === 'TECHNICIAN' && <>
        <Field label="Verified technician ID" value={authForm.technicianVerifiedId} onChangeText={(value: string) => setAuthForm({ ...authForm, technicianVerifiedId: value })} />
        <Field label="Operating city" value={authForm.city} onChangeText={(value: string) => setAuthForm({ ...authForm, city: value })} />
        <Text style={styles.label}>Services you provide</Text>
        <View style={styles.chips}>{SKILLS.map(skill => <Choice key={skill} active={selectedSkills.includes(skill)} label={skill} onPress={() => setSelectedSkills(old => old.includes(skill) ? old.filter(item => item !== skill) : [...old, skill])} />)}</View>
      </>}
      {!!authError && <Text style={styles.error}>{authError}</Text>}
      <Action label={authBusy ? 'Please wait…' : authMode === 'LOGIN' ? 'Sign in' : 'Create account'} disabled={authBusy} onPress={onAuthSubmit} />
      <Pressable onPress={() => { setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN'); setAuthError(''); }}>
        <Text style={styles.switchText}>{authMode === 'LOGIN' ? 'New to FieldFix? Create an account' : 'Already registered? Sign in'}</Text>
      </Pressable>
    </ScrollView></SafeAreaView>
  );

  if (user.role === 'ADMIN') return <Centered><Text style={styles.heading}>Use the web dashboard</Text><Action label="Sign out" onPress={signOut} /></Centered>;

  const customer = user.role === 'CUSTOMER';
  return <SafeAreaView style={styles.safe}><View style={styles.topBar}>
    <View><Text style={styles.brandSmall}>⚡ FieldFix</Text><Text style={styles.muted}>Hello, {user.name}</Text></View>
    <Pressable onPress={signOut}><Text style={styles.link}>Sign out</Text></Pressable>
  </View>
  {!!notifications.length && <View style={styles.notice}><Text style={styles.noticeTitle}>Updates</Text>{notifications.map((item, index) => <Text key={`${index}-${item}`} style={styles.noticeText}>{item}</Text>)}<Pressable onPress={() => setNotifications([])}><Text style={styles.link}>Clear</Text></Pressable></View>}
  {chatBooking ? <View style={styles.chatPanel}>
    <View style={styles.rowBetween}><View><Text style={styles.heading}>Booking chat</Text><Text style={styles.muted}>{chatBooking.service} · {customer ? chatBooking.technicianName : chatBooking.customerName || 'Customer'}</Text></View><Pressable onPress={() => setChatBooking(null)}><Text style={styles.link}>Close</Text></Pressable></View>
    <ScrollView style={styles.messages} contentContainerStyle={{ paddingVertical: 8 }}>
      {!chatMessages.length && <Text style={styles.muted}>No messages yet. Start the conversation.</Text>}
      {chatMessages.map((message, index) => <View key={message.id || `${message.createdAt}-${index}`} style={[styles.message, message.senderId === user.id && styles.ownMessage]}><Text style={styles.messageSender}>{message.sender?.name || (message.senderId === user.id ? 'You' : 'Participant')}</Text><Text style={styles.bodyText}>{message.body}</Text><Text style={styles.messageTime}>{formatDate(message.createdAt)}</Text></View>)}
    </ScrollView>
    <View style={styles.compose}><TextInput value={chatInput} onChangeText={setChatInput} style={[styles.input, styles.composeInput]} placeholder="Write a message" placeholderTextColor="#8a998e" multiline /><Action label={chatBusy ? 'Sending…' : 'Send'} disabled={chatBusy || !chatInput.trim()} onPress={sendChatMessage} /></View>
  </View> : <>
  {customer ? <View style={styles.row}>
    <Choice active={activeTab === 'JOBS'} label="My bookings" onPress={() => setActiveTab('JOBS')} />
    <Choice active={activeTab === 'BOOK'} label="Book a service" onPress={() => setActiveTab('BOOK')} />
  </View> : <View style={styles.availability}><Text style={styles.bodyText}>Available for new jobs</Text><Switch value={available} onValueChange={setTechnicianAvailability} /></View>}
  {customer && activeTab === 'BOOK' ? <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Text style={styles.heading}>Book a service</Text>
    <Text style={styles.muted}>We’ll match an available technician in your city. Price is set by the server.</Text>
    <Text style={styles.label}>Choose a service</Text>
    <View style={styles.chips}>{SERVICES.map(item => <Choice key={item} active={service === item} label={item} onPress={() => setService(item)} />)}</View>
    <Field label="City" value={city} onChangeText={setCity} />
    <Field label="Service address" value={address} onChangeText={setAddress} multiline />
    <Field label="Appointment date (YYYY-MM-DD)" value={appointmentDate} onChangeText={setAppointmentDate} />
    <Field label="Describe the issue" value={description} onChangeText={setDescription} multiline />
    <Action label={coords ? 'Update my location' : 'Use my current location'} secondary onPress={useMyLocation} />
    {coords ? <Text style={styles.muted}>Map location: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}</Text> : <Text style={styles.muted}>Use current location to attach accurate coordinates. Without it, we use the city center.</Text>}
    <View style={styles.map}><LocationMap point={coords} title="Service location" onSelect={setCoords} /></View>
    <Action label={bookingBusy ? 'Starting secure checkout…' : 'Continue to secure payment'} disabled={bookingBusy} onPress={submitBooking} />
  </ScrollView> : <ScrollView contentContainerStyle={styles.page}>
    <View style={styles.rowBetween}><Text style={styles.heading}>{customer ? 'Your bookings' : 'Assigned jobs'}</Text><Pressable onPress={refreshBookings}><Text style={styles.link}>Refresh</Text></Pressable></View>
    {!bookings.length && <Text style={styles.muted}>{customer ? 'No bookings yet. Start by booking a service.' : 'No jobs are assigned to you yet.'}</Text>}
    {bookings.map(booking => <View key={booking.id} style={styles.card}>
      <View style={styles.rowBetween}><Text style={styles.cardTitle}>{booking.service}</Text><Text style={styles.status}>{booking.status.replaceAll('_', ' ')}</Text></View>
      <Text style={styles.bodyText}>{booking.address}</Text>
      <Text style={styles.muted}>{formatDate(booking.scheduledAt)} · ₹{booking.amount} · {booking.paymentStatus}</Text>
      {customer ? <><Text style={styles.muted}>Technician: {booking.technicianName || 'Awaiting assignment'}</Text><Action label="Open booking chat" secondary onPress={() => setChatBooking(booking)} /></> : <>
        <Text style={styles.bodyText}>Customer: {booking.customerName || 'Customer'}</Text>
        <Action label="Message customer" secondary onPress={() => setChatBooking(booking)} />
        <Action label={transition[booking.status] ? `Mark ${transition[booking.status].toLowerCase().replace('_', ' ')}` : 'Job complete'} disabled={!transition[booking.status]} onPress={() => advanceJob(booking)} />
      </>}
      {liveLocations[booking.id] && <View style={styles.map}><LocationMap point={liveLocations[booking.id]} title={customer ? 'Technician location' : 'Your location'} follow /></View>}
    </View>)}
  </ScrollView>}
  </>}
  </SafeAreaView>;
}

function Centered({ children }: { children: React.ReactNode }) { return <SafeAreaView style={styles.safe}><View style={styles.center}>{children}</View></SafeAreaView>; }
function Field(props: any) { return <View style={styles.field}><Text style={styles.label}>{props.label}</Text><TextInput {...props} style={[styles.input, props.multiline && styles.multiline]} placeholderTextColor="#8a998e" /></View>; }
function Action({ label, onPress, disabled, secondary }: { label: string; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  return <Pressable onPress={onPress} disabled={disabled} style={[styles.action, secondary && styles.secondaryAction, disabled && styles.disabled]}><Text style={[styles.actionText, secondary && styles.secondaryText]}>{label}</Text></Pressable>;
}
function Choice({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.choice, active && styles.choiceActive]}><Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f7f3' }, authWrap: { flexGrow: 1, justifyContent: 'center', padding: 24, maxWidth: 620, width: '100%', alignSelf: 'center' },
  page: { padding: 20, paddingBottom: 48, maxWidth: 760, width: '100%', alignSelf: 'center' }, topBar: { paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' },
  brand: { fontSize: 30, fontWeight: '900', color: '#285d46', marginBottom: 12 }, brandSmall: { fontSize: 20, fontWeight: '900', color: '#285d46' }, heading: { fontSize: 24, fontWeight: '800', color: '#1e362b', marginVertical: 8 }, muted: { color: '#66776b', marginTop: 5, marginBottom: 10, lineHeight: 20 },
  bodyText: { color: '#294136', marginVertical: 5 }, label: { color: '#354f40', fontWeight: '700', marginBottom: 6, marginTop: 12 }, field: { marginBottom: 5 }, input: { borderWidth: 1, borderColor: '#d5e0d5', backgroundColor: 'white', paddingHorizontal: 13, paddingVertical: 12, borderRadius: 10, color: '#20382c', minHeight: 46 }, multiline: { minHeight: 80, textAlignVertical: 'top' },
  action: { backgroundColor: '#285d46', borderRadius: 10, padding: 14, alignItems: 'center', marginVertical: 10 }, actionText: { color: 'white', fontWeight: '800' }, secondaryAction: { backgroundColor: 'white', borderWidth: 1, borderColor: '#285d46' }, secondaryText: { color: '#285d46' }, disabled: { opacity: 0.5 },
  choice: { borderWidth: 1, borderColor: '#d5e0d5', backgroundColor: 'white', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, marginRight: 7, marginBottom: 7 }, choiceActive: { backgroundColor: '#285d46', borderColor: '#285d46' }, choiceText: { color: '#33483a', fontSize: 13 }, choiceTextActive: { color: 'white', fontWeight: '700' }, row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'white' }, chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }, switchText: { textAlign: 'center', color: '#285d46', fontWeight: '700', marginTop: 12, padding: 8 }, error: { color: '#ad2f35', marginVertical: 8 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#e0e9e0', marginVertical: 8 }, rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, cardTitle: { color: '#20382c', fontSize: 17, fontWeight: '800', flex: 1 }, status: { color: '#285d46', fontSize: 12, fontWeight: '800' }, link: { color: '#285d46', fontWeight: '800', padding: 8 }, map: { height: 240, borderRadius: 12, overflow: 'hidden', marginVertical: 10, backgroundColor: '#e4eee6' }, availability: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 10 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  notice: { margin: 12, padding: 12, borderRadius: 10, backgroundColor: '#e4f1e7' }, noticeTitle: { color: '#285d46', fontWeight: '800' }, noticeText: { color: '#294136', marginTop: 4 }, chatPanel: { flex: 1, padding: 16, maxWidth: 760, width: '100%', alignSelf: 'center' }, messages: { flex: 1, marginVertical: 8 }, message: { alignSelf: 'flex-start', backgroundColor: 'white', borderRadius: 12, padding: 10, marginVertical: 5, maxWidth: '88%' }, ownMessage: { alignSelf: 'flex-end', backgroundColor: '#e4f1e7' }, messageSender: { color: '#285d46', fontWeight: '700' }, messageTime: { color: '#66776b', fontSize: 11, marginTop: 4 }, compose: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 }, composeInput: { flex: 1 },
});
