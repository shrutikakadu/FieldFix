import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { getHealthCheck } from './src/services/api';
import { socket } from './src/services/socket';

const isWeb = Platform.OS === 'web';

/* ─────────────────────────────────────────────────────────────
   LANDING PAGE COMPONENT (Shown first on web)
───────────────────────────────────────────────────────────── */
interface LandingProps {
  onSelectRole: (role: 'CUSTOMER' | 'TECHNICIAN', preselectedService?: string) => void;
}

function LandingScreen({ onSelectRole }: LandingProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(25)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: false }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: false }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const FEATURES = [
    { icon: '🛰️', title: 'Live GPS Tracking', desc: 'Watch your assigned technician arrive in real-time with second-by-second updates.' },
    { icon: '⚡', title: 'Instant Dispatch', desc: 'Our smart routing matches your job to the nearest qualified technician in under 30 seconds.' },
    { icon: '🛡️', title: '100% Verified Pros', desc: 'Every technician is background checked, licensed, insured, and rated by customers.' },
    { icon: '💬', title: 'Private In-App Chat', desc: 'Communicate directly with your technician without exposing personal phone numbers.' },
    { icon: '📊', title: 'Live Job Milestones', desc: 'Track stages from Dispatched, Arrived, In Progress, to Completed seamlessly.' },
    { icon: '🔌', title: 'Socket.IO Architecture', desc: 'Built on high-speed real-time event infrastructure with sub-100ms latency.' },
  ];

  const SERVICES = [
    { icon: '❄️', name: 'HVAC & AC Repair', price: 'From $85', desc: 'Diagnosis, freon refills, full maintenance' },
    { icon: '⚡', name: 'Electrical Works', price: 'From $75', desc: 'Wiring, fixtures, circuit breakers & panels' },
    { icon: '🚰', name: 'Plumbing Solutions', price: 'From $95', desc: 'Leak detection, pipe repairs, faucet fixtures' },
    { icon: '🔒', name: 'Smart Home & Security', price: 'From $120', desc: 'CCTV, smart locks, automation setup' },
    { icon: '🎨', name: 'Painting & Touchups', price: 'From $60', desc: 'Interior & exterior professional painting' },
    { icon: '🛠️', name: 'Carpentry & Furniture', price: 'From $80', desc: 'Custom shelves, furniture assembly, doors' },
  ];

  const STEPS = [
    { num: '01', title: 'Select Service', desc: 'Choose what you need repaired or installed in just two taps.' },
    { num: '02', title: 'Instant Match', desc: 'Our dispatch algorithm assigns the nearest available specialist.' },
    { num: '03', title: 'Live GPS Tracking', desc: 'Follow your technician on the live map and chat directly.' },
    { num: '04', title: 'Job Done & Rated', desc: 'Inspect work, pay securely in-app, and leave your verified review.' },
  ];

  const TESTIMONIALS = [
    { stars: '★★★★★', quote: 'Our AC died on a 95-degree afternoon. A FieldFix tech was at our door within 22 minutes! Watching him drive over live gave us total confidence.', author: 'Marcus Reynolds', role: 'Homeowner, San Francisco' },
    { stars: '★★★★★', quote: 'I manage 40 rental units. The ability to dispatch technicians, monitor arrival times, and verify completed jobs on FieldFix saved us hundreds of hours.', author: 'Elena Rostova', role: 'Property Portfolio Manager' },
    { stars: '★★★★★', quote: 'The technician console is clean and intuitive. Real-time GPS pings, upcoming job queues, and quick status toggles make daily routes super efficient.', author: 'David Miller', role: 'Certified HVAC Technician' },
  ];

  return (
    <ScrollView style={styles.landingScroll} contentContainerStyle={styles.landingContainer} showsVerticalScrollIndicator={false}>
      {/* ── TOP NAVBAR ── */}
      <View style={styles.navBar}>
        <View style={styles.navLogoRow}>
          <View style={styles.logoBadge}><Text style={styles.logoBadgeText}>⚡</Text></View>
          <Text style={styles.logoTitle}>Field<Text style={styles.logoHighlight}>Fix</Text></Text>
          <View style={styles.liveTag}><Text style={styles.liveTagText}>LIVE PLATFORM</Text></View>
        </View>
        <View style={styles.navActionRow}>
          <TouchableOpacity style={styles.navGhostBtn} onPress={() => onSelectRole('TECHNICIAN')}>
            <Text style={styles.navGhostBtnText}>🔧 Tech Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navSolidBtn} onPress={() => onSelectRole('CUSTOMER')}>
            <Text style={styles.navSolidBtnText}>⚡ Book a Tech</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── HERO SECTION ── */}
      <Animated.View style={[styles.heroWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.heroPill}>
          <View style={styles.heroPillPulse} />
          <Text style={styles.heroPillText}>Next-Gen Real-Time Field Service Platform</Text>
        </View>

        <Text style={styles.heroHeading}>
          Instant Field Service,{'\n'}
          <Text style={styles.heroGradientSky}>Tracked Live</Text> to Your Door
        </Text>

        <Text style={styles.heroSub}>
          Connect with certified local professionals in under 30 seconds. Track your technician’s exact GPS arrival, chat privately in real-time, and manage everything from a single intuitive platform.
        </Text>

        {/* Primary Call-to-Actions */}
        <View style={styles.heroCtas}>
          <TouchableOpacity style={styles.ctaPrimary} onPress={() => onSelectRole('CUSTOMER')}>
            <Text style={styles.ctaPrimaryText}>⚡  Book a Technician (Customer)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctaSecondary} onPress={() => onSelectRole('TECHNICIAN')}>
            <Text style={styles.ctaSecondaryText}>🔧  Technician Console</Text>
          </TouchableOpacity>
        </View>

        {/* Live Metrics Row */}
        <View style={styles.metricsBar}>
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>50,000+</Text>
            <Text style={styles.metricLabel}>Customers Served</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>2,400+</Text>
            <Text style={styles.metricLabel}>Verified Technicians</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>4.9 ★</Text>
            <Text style={styles.metricLabel}>Customer Satisfaction</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>&lt; 30s</Text>
            <Text style={styles.metricLabel}>Avg. Dispatch Time</Text>
          </View>
        </View>
      </Animated.View>

      {/* ── INTERACTIVE LIVE PREVIEW PHONE FRAME ── */}
      <View style={styles.previewContainer}>
        <View style={styles.previewGlow} />
        <View style={styles.mockPhone}>
          {/* Phone Top Notch */}
          <View style={styles.mockNotchBar}><View style={styles.mockSpeaker} /></View>
          
          {/* Header */}
          <View style={styles.mockHeader}>
            <Text style={styles.mockBrand}>⚡ FieldFix Mobile</Text>
            <View style={styles.mockLivePill}>
              <View style={styles.mockDot} />
              <Text style={styles.mockLiveText}>Connected</Text>
            </View>
          </View>

          {/* Body content */}
          <View style={styles.mockBody}>
            <View style={styles.mockCard}>
              <View style={styles.mockCardTop}>
                <View style={styles.mockBadge}><Text style={styles.mockBadgeText}>● DISPATCHED</Text></View>
                <Text style={styles.mockEta}>⏱ 12 mins away</Text>
              </View>
              <Text style={styles.mockJobTitle}>HVAC AC Diagnostic & Overhaul</Text>
              <Text style={styles.mockJobId}>Job #BK-9021 • Urgent Priority</Text>

              <View style={styles.mockTechRow}>
                <View style={styles.mockAvatar}><Text style={styles.mockAvatarText}>DM</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mockTechName}>David Miller</Text>
                  <Text style={styles.mockTechSub}>⭐ 4.9 • 142 Completed Jobs</Text>
                </View>
                <View style={styles.mockPillGreen}><Text style={styles.mockPillGreenText}>En Route</Text></View>
              </View>

              {/* Simulated Map */}
              <View style={styles.mockMap}>
                <View style={styles.mockRadar} />
                <View style={styles.mockMarkerHome}><Text style={styles.mockMarkerText}>🏠 You</Text></View>
                <View style={styles.mockMarkerTech}><Text style={styles.mockMarkerText}>🚚 David M.</Text></View>
                <Text style={styles.mockGpsText}>📡 37.7749° N, 122.4194° W</Text>
              </View>

              <View style={styles.mockBtnRow}>
                <TouchableOpacity style={styles.mockBtn} onPress={() => onSelectRole('CUSTOMER')}>
                  <Text style={styles.mockBtnText}>📱 Open Live Customer App</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ── CORE FEATURES GRID ── */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionPill}><Text style={styles.sectionPillText}>POWERFUL FEATURES</Text></View>
        <Text style={styles.sectionTitle}>Engineered for Real-Time Precision</Text>
        <Text style={styles.sectionSub}>Everything you need to book, monitor, and manage on-demand field services.</Text>
        <View style={styles.featuresGrid}>
          {FEATURES.map((feat, idx) => (
            <View key={idx} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{feat.icon}</Text>
              <Text style={styles.featureTitle}>{feat.title}</Text>
              <Text style={styles.featureDesc}>{feat.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── HOW IT WORKS STEPS ── */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionPill}><Text style={styles.sectionPillText}>SIMPLE PROCESS</Text></View>
        <Text style={styles.sectionTitle}>From Problem to Solved in 4 Steps</Text>
        <Text style={styles.sectionSub}>No more waiting days for callbacks. Get matched with a local pro immediately.</Text>
        <View style={styles.stepsGrid}>
          {STEPS.map((step, idx) => (
            <View key={idx} style={styles.stepCard}>
              <View style={styles.stepNumCircle}><Text style={styles.stepNumText}>{step.num}</Text></View>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── SERVICES CATALOG ── */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionPill}><Text style={styles.sectionPillText}>INSTANT BOOKING</Text></View>
        <Text style={styles.sectionTitle}>Popular On-Demand Services</Text>
        <Text style={styles.sectionSub}>Transparent pricing with verified technicians ready to dispatch.</Text>
        <View style={styles.servicesGrid}>
          {SERVICES.map((svc, idx) => (
            <View key={idx} style={styles.serviceCard}>
              <Text style={styles.serviceIcon}>{svc.icon}</Text>
              <Text style={styles.serviceName}>{svc.name}</Text>
              <Text style={styles.serviceDesc}>{svc.desc}</Text>
              <View style={styles.serviceBottom}>
                <Text style={styles.servicePrice}>{svc.price}</Text>
                <TouchableOpacity
                  style={styles.serviceBookBtn}
                  onPress={() => onSelectRole('CUSTOMER', svc.name)}
                >
                  <Text style={styles.serviceBookBtnText}>Book Now →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── TESTIMONIALS ── */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionPill}><Text style={styles.sectionPillText}>COMMUNITY REVIEWS</Text></View>
        <Text style={styles.sectionTitle}>Trusted by Thousands Everyday</Text>
        <Text style={styles.sectionSub}>Read verified experiences from real customers and service providers.</Text>
        <View style={styles.testiList}>
          {TESTIMONIALS.map((t, idx) => (
            <View key={idx} style={styles.testiCard}>
              <Text style={styles.testiStars}>{t.stars}</Text>
              <Text style={styles.testiQuote}>"{t.quote}"</Text>
              <View style={styles.testiMeta}>
                <Text style={styles.testiAuthor}>{t.author}</Text>
                <Text style={styles.testiRole}>{t.role}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── BOTTOM CTA BANNER ── */}
      <View style={styles.ctaBanner}>
        <Text style={styles.ctaBannerTitle}>Ready for Seamless Field Service?</Text>
        <Text style={styles.ctaBannerSub}>Book your technician now or manage field dispatches in real-time.</Text>
        <View style={styles.heroCtas}>
          <TouchableOpacity style={styles.ctaPrimary} onPress={() => onSelectRole('CUSTOMER')}>
            <Text style={styles.ctaPrimaryText}>🚀  Launch Customer App</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctaSecondary} onPress={() => onSelectRole('TECHNICIAN')}>
            <Text style={styles.ctaSecondaryText}>🔧  Technician Portal</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── FOOTER ── */}
      <View style={styles.footer}>
        <View style={styles.navLogoRow}>
          <View style={styles.logoBadge}><Text style={styles.logoBadgeText}>⚡</Text></View>
          <Text style={styles.logoTitle}>Field<Text style={styles.logoHighlight}>Fix</Text></Text>
        </View>
        <Text style={styles.footerText}>© 2026 FieldFix Technologies Inc. All rights reserved.</Text>
        <Text style={styles.footerSub}>Real-Time Field Service Management & Technician Dispatch Platform</Text>
      </View>
    </ScrollView>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN APPLICATION (App Screen)
───────────────────────────────────────────────────────────── */
export default function App() {
  const [screen, setScreen] = useState<'LANDING' | 'APP'>('LANDING');
  const [role, setRole] = useState<'CUSTOMER' | 'TECHNICIAN'>('CUSTOMER');
  const [activeTab, setActiveTab] = useState<'HOME' | 'TRACKING' | 'CATALOG' | 'PROFILE'>('HOME');
  const [backendConnected, setBackendConnected] = useState<boolean>(socket.connected);
  const [techOnDuty, setTechOnDuty] = useState<boolean>(true);
  const [jobStatus, setJobStatus] = useState<'DISPATCHED' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED'>('DISPATCHED');
  const [lastGpsSent, setLastGpsSent] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [gpsPingCount, setGpsPingCount] = useState<number>(0);

  useEffect(() => {
    checkApi();
    function onConnect() { setBackendConnected(true); }
    function onDisconnect() { setBackendConnected(false); }
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const checkApi = async () => {
    const health = await getHealthCheck();
    setBackendConnected(!!health);
  };

  const sendLiveGpsPing = () => {
    const randomLat = 37.7749 + (Math.random() - 0.5) * 0.015;
    const randomLng = -122.4194 + (Math.random() - 0.5) * 0.015;
    socket.emit('location:update', {
      technicianId: '501 (David M.)',
      bookingId: 'BK-9021',
      lat: randomLat,
      lng: randomLng,
    });
    setGpsPingCount((prev) => prev + 1);
    setLastGpsSent(`${randomLat.toFixed(4)}, ${randomLng.toFixed(4)}`);
  };

  const handleSelectRole = (newRole: 'CUSTOMER' | 'TECHNICIAN', preselectedService?: string) => {
    setRole(newRole);
    if (preselectedService) {
      setSelectedService(preselectedService);
    }
    setScreen('APP');
  };

  // If on LANDING screen, render the landing page view
  if (screen === 'LANDING') {
    return (
      <View style={styles.appRoot}>
        <LandingScreen onSelectRole={handleSelectRole} />
      </View>
    );
  }

  // If on APP screen, render the phone frame UI
  return (
    <View style={styles.appRoot}>
      <View style={[styles.phoneFrame, !isWeb && styles.phoneFull]}>

        {/* APP HEADER */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            {/* Click to go back to Landing */}
            <TouchableOpacity onPress={() => setScreen('LANDING')} style={styles.backHomeBtn}>
              <Text style={styles.backHomeIcon}>←</Text>
              <Text style={styles.brandName}>Field<Text style={styles.logoHighlight}>Fix</Text></Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.serverPill} onPress={checkApi}>
              <View style={[styles.serverDot, backendConnected ? styles.dotGreen : styles.dotRed]} />
              <Text style={styles.serverText}>
                {backendConnected ? 'Server Live' : 'Offline'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Role Toggle */}
          <View style={styles.roleBar}>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'CUSTOMER' && styles.roleBtnActiveBlue]}
              onPress={() => setRole('CUSTOMER')}
            >
              <Text style={[styles.roleBtnText, role === 'CUSTOMER' && styles.roleBtnTextActive]}>
                🛒 Customer Portal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'TECHNICIAN' && styles.roleBtnActiveGreen]}
              onPress={() => setRole('TECHNICIAN')}
            >
              <Text style={[styles.roleBtnText, role === 'TECHNICIAN' && styles.roleBtnTextActive]}>
                🔧 Technician Console
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BODY */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {role === 'CUSTOMER' ? (
            <>
              {/* Live Tracking Hero Card */}
              <View style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE TRACKING</Text>
                  </View>
                  <Text style={styles.etaChip}>⏱ 12 mins away</Text>
                </View>

                <Text style={styles.serviceCardTitle}>HVAC Air Conditioning Overhaul</Text>
                <Text style={styles.bookingId}>Booking #BK-9021 • Urgent Priority</Text>

                <View style={styles.techRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarLetters}>DM</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.techNameText}>David Miller</Text>
                    <Text style={styles.techRatingText}>⭐ 4.9 • 142 Completed Jobs</Text>
                  </View>
                  <View style={styles.enRoutePill}>
                    <Text style={styles.enRouteText}>En Route</Text>
                  </View>
                </View>

                <View style={styles.mapArea}>
                  <View style={styles.radarRing} />
                  <View style={[styles.mapMarker, styles.mapMarkerTech]}>
                    <Text style={styles.mapMarkerText}>🚚 David M.</Text>
                  </View>
                  <View style={[styles.mapMarker, styles.mapMarkerHome]}>
                    <Text style={styles.mapMarkerText}>🏠 You</Text>
                  </View>
                  <Text style={styles.coordText}>
                    📡 {lastGpsSent || '37.7749° N, 122.4194° W'}
                  </Text>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => Alert.alert('Calling Technician', 'Connecting to David Miller via masked call...')}
                  >
                    <Text style={styles.callBtnText}>📞 Call Tech</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.chatBtn}
                    onPress={() => Alert.alert('Live Chat', 'Opening in-app chat with David Miller...')}
                  >
                    <Text style={styles.chatBtnText}>💬 Live Chat</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Service Catalog */}
              <Text style={styles.sectionLabel}>Available Services</Text>
              <View style={styles.catalogGrid}>
                {[
                  { icon: '❄️', name: 'HVAC Service', price: '$85' },
                  { icon: '⚡', name: 'Electrical', price: '$75' },
                  { icon: '🚰', name: 'Plumbing', price: '$95' },
                  { icon: '🔒', name: 'Smart Home', price: '$120' },
                  { icon: '🎨', name: 'Painting', price: '$60' },
                  { icon: '🛠️', name: 'Carpentry', price: '$80' },
                ].map((svc) => (
                  <TouchableOpacity
                    key={svc.name}
                    style={[styles.catCard, selectedService === svc.name && styles.catCardSelected]}
                    onPress={() => setSelectedService(svc.name)}
                  >
                    <Text style={styles.catIcon}>{svc.icon}</Text>
                    <Text style={styles.catName}>{svc.name}</Text>
                    <Text style={styles.catPrice}>{svc.price}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedService && (
                <View style={styles.confirmCard}>
                  <Text style={styles.confirmTitle}>Ready to Book: {selectedService}</Text>
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={() => {
                      Alert.alert('Booking Dispatched!', `Request for ${selectedService} dispatched to nearby techs.`);
                      setSelectedService(null);
                    }}
                  >
                    <Text style={styles.confirmBtnText}>⚡ Confirm Booking</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <>
              {/* Technician Duty Card */}
              <View style={styles.dutyCard}>
                <View style={styles.dutyTopRow}>
                  <View>
                    <Text style={styles.consoleName}>Technician Console</Text>
                    <Text style={styles.consoleId}>David Miller • ID #501</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.dutyPill, techOnDuty ? styles.dutyPillOn : styles.dutyPillOff]}
                    onPress={() => setTechOnDuty(!techOnDuty)}
                  >
                    <Text style={styles.dutyPillText}>
                      {techOnDuty ? '🟢 ON DUTY' : '🔴 OFF DUTY'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Performance stats */}
                <View style={styles.statsBar}>
                  <View style={styles.statCell}>
                    <Text style={styles.statVal}>142</Text>
                    <Text style={styles.statKey}>Jobs Done</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCell}>
                    <Text style={styles.statVal}>4.9 ★</Text>
                    <Text style={styles.statKey}>Rating</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCell}>
                    <Text style={styles.statVal}>98%</Text>
                    <Text style={styles.statKey}>On-Time</Text>
                  </View>
                </View>
              </View>

              {/* Active Assigned Job */}
              <View style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                  <View style={styles.dispatchBadge}>
                    <Text style={styles.dispatchText}>CURRENT ASSIGNMENT</Text>
                  </View>
                  <Text style={styles.urgentChip}>🚨 Urgent</Text>
                </View>

                <Text style={styles.serviceCardTitle}>HVAC Air Conditioning Overhaul</Text>
                <Text style={styles.customerMeta}>Customer: Sarah Jenkins • (415) 555-0199</Text>
                <Text style={styles.customerAddr}>📍 742 Evergreen Terrace, San Francisco</Text>

                {/* GPS Dispatch Button */}
                <TouchableOpacity style={styles.gpsBtn} onPress={sendLiveGpsPing}>
                  <Text style={styles.gpsBtnText}>
                    📡 Send Live GPS Ping ({gpsPingCount} Sent)
                  </Text>
                </TouchableOpacity>
                {lastGpsSent && (
                  <Text style={styles.gpsReadout}>Last GPS Broadcast: {lastGpsSent}</Text>
                )}

                {/* Job Status Stepper */}
                <Text style={styles.stepperLabel}>Update Current Job State:</Text>
                <View style={styles.stepperRow}>
                  {(['DISPATCHED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'] as const).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.stepBtn, jobStatus === s && styles.stepBtnActive]}
                      onPress={() => setJobStatus(s)}
                    >
                      <Text style={styles.stepBtnText}>
                        {s === 'DISPATCHED' ? 'En Route' : s === 'ARRIVED' ? 'Arrived' : s === 'IN_PROGRESS' ? 'Working' : 'Done'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Upcoming Jobs */}
              <Text style={styles.sectionLabel}>Upcoming Assigned Jobs</Text>
              <View style={styles.upcomingCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.upcomingId}>#BK-9024</Text>
                  <Text style={styles.upcomingSvc}>Smart Thermostat Installation</Text>
                  <Text style={styles.upcomingAddr}>📍 1044 Market St, Suite 400</Text>
                </View>
                <Text style={styles.upcomingTime}>2:30 PM</Text>
              </View>
            </>
          )}
        </ScrollView>

        {/* BOTTOM TAB BAR */}
        <View style={styles.tabBar}>
          {[
            { key: 'HOME', icon: '🏠', label: 'Home' },
            { key: 'TRACKING', icon: '🛰️', label: 'Tracking' },
            { key: 'CATALOG', icon: '⚡', label: 'Services' },
            { key: 'PROFILE', icon: '👤', label: 'Profile' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Text style={[styles.tabIcon, activeTab === tab.key && styles.tabIconActive]}>
                {tab.icon}
              </Text>
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────
   STYLESHEET
───────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  // Root app wrapper
  appRoot: {
    flex: 1,
    minHeight: (isWeb ? '100vh' : '100%') as any,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── LANDING STYLES ──
  landingScroll: {
    width: '100%',
    flex: 1,
    backgroundColor: '#020617',
  },
  landingContainer: {
    paddingBottom: 60,
    alignItems: 'center',
  },
  navBar: {
    width: '100%',
    maxWidth: 1200,
    paddingHorizontal: 24,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.7)',
  },
  navLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeText: {
    fontSize: 18,
    color: '#fff',
  },
  logoTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  logoHighlight: {
    color: '#38bdf8',
  },
  liveTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginLeft: 6,
  },
  liveTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.5,
  },
  navActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navGhostBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  navGhostBtnText: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 13,
  },
  navSolidBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  navSolidBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },

  // Hero Section
  heroWrap: {
    width: '100%',
    maxWidth: 960,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 36,
    alignItems: 'center',
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 100,
    marginBottom: 20,
  },
  heroPillPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38bdf8',
  },
  heroPillText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  heroHeading: {
    fontSize: isWeb ? 48 : 32,
    fontWeight: '900',
    color: '#f8fafc',
    textAlign: 'center',
    lineHeight: isWeb ? 56 : 40,
    letterSpacing: -1,
    marginBottom: 18,
  },
  heroGradientSky: {
    color: '#38bdf8',
  },
  heroSub: {
    fontSize: isWeb ? 17 : 14,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 720,
    lineHeight: isWeb ? 26 : 22,
    marginBottom: 32,
  },
  heroCtas: {
    flexDirection: isWeb ? 'row' : 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    width: '100%',
    maxWidth: 520,
    marginBottom: 44,
  },
  ctaPrimary: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    flex: isWeb ? 1 : undefined,
    width: isWeb ? undefined : '100%',
  },
  ctaPrimaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  ctaSecondary: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    flex: isWeb ? 1 : undefined,
    width: isWeb ? undefined : '100%',
  },
  ctaSecondaryText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '800',
  },

  // Metrics Bar
  metricsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.8)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 820,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  metricItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  metricVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: -0.5,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#1e293b',
  },

  // Preview Phone Mockup
  previewContainer: {
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginVertical: 40,
    position: 'relative',
  },
  previewGlow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    top: 50,
  },
  mockPhone: {
    width: '100%',
    backgroundColor: '#0b1120',
    borderRadius: 36,
    borderWidth: 5,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  mockNotchBar: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  mockSpeaker: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1e293b',
  },
  mockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  mockBrand: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38bdf8',
  },
  mockLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  mockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  mockLiveText: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '700',
  },
  mockBody: {
    padding: 14,
  },
  mockCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  mockCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mockBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mockBadgeText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
  },
  mockEta: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  mockJobTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
  },
  mockJobId: {
    color: '#64748b',
    fontSize: 10,
    marginBottom: 10,
  },
  mockTechRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#020617',
    padding: 8,
    borderRadius: 10,
    marginBottom: 10,
  },
  mockAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockAvatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 11,
  },
  mockTechName: {
    color: '#f1f5f9',
    fontWeight: '700',
    fontSize: 12,
  },
  mockTechSub: {
    color: '#64748b',
    fontSize: 9,
  },
  mockPillGreen: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mockPillGreenText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: '800',
  },
  mockMap: {
    height: 100,
    backgroundColor: '#020617',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    justifyContent: 'space-between',
    padding: 8,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 12,
  },
  mockRadar: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    top: 10,
    left: 40,
  },
  mockMarkerHome: {
    backgroundColor: '#065f46',
    alignSelf: 'flex-end',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mockMarkerTech: {
    backgroundColor: '#0284c7',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mockMarkerText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  mockGpsText: {
    color: '#64748b',
    fontSize: 9,
    textAlign: 'center',
  },
  mockBtnRow: {
    marginTop: 4,
  },
  mockBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  mockBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },

  // Sections Common
  sectionWrap: {
    width: '100%',
    maxWidth: 1100,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  sectionPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    marginBottom: 12,
  },
  sectionPillText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: isWeb ? 34 : 26,
    fontWeight: '900',
    color: '#f8fafc',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  sectionSub: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 600,
    marginBottom: 36,
    lineHeight: 22,
  },

  // Features Grid
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    width: '100%',
    justifyContent: 'center',
  },
  featureCard: {
    width: isWeb ? '31%' : '100%',
    minWidth: 260,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 22,
    alignItems: 'flex-start',
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
  },

  // Steps Grid
  stepsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    width: '100%',
    justifyContent: 'center',
  },
  stepCard: {
    width: isWeb ? '23%' : '100%',
    minWidth: 220,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  stepNumCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  stepNumText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 6,
    textAlign: 'center',
  },
  stepDesc: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Services Grid
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    width: '100%',
    justifyContent: 'center',
  },
  serviceCard: {
    width: isWeb ? '31%' : '100%',
    minWidth: 260,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 20,
  },
  serviceIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 16,
    lineHeight: 18,
  },
  serviceBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#38bdf8',
  },
  serviceBookBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  serviceBookBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },

  // Testimonials
  testiList: {
    flexDirection: isWeb ? 'row' : 'column',
    gap: 16,
    width: '100%',
    justifyContent: 'center',
  },
  testiCard: {
    flex: isWeb ? 1 : undefined,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 22,
  },
  testiStars: {
    color: '#fbbf24',
    fontSize: 14,
    marginBottom: 10,
    letterSpacing: 2,
  },
  testiQuote: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  testiMeta: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 12,
  },
  testiAuthor: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  testiRole: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },

  // CTA Banner
  ctaBanner: {
    width: '90%',
    maxWidth: 960,
    marginTop: 70,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 24,
    paddingVertical: 44,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  ctaBannerTitle: {
    fontSize: isWeb ? 30 : 22,
    fontWeight: '900',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 10,
  },
  ctaBannerSub: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 28,
  },

  // Footer
  footer: {
    width: '100%',
    maxWidth: 1200,
    marginTop: 70,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  footerSub: {
    color: '#475569',
    fontSize: 11,
    textAlign: 'center',
  },

  // ── APP CONTAINER & PHONE FRAME ──
  phoneFrame: {
    width: isWeb ? 400 : '100%',
    height: (isWeb ? '92vh' : '100%') as any,
    maxHeight: isWeb ? 850 : undefined,
    backgroundColor: '#0b1120',
    borderRadius: isWeb ? 36 : 0,
    borderWidth: isWeb ? 6 : 0,
    borderColor: '#1e293b',
    overflow: 'hidden',
    flexDirection: 'column',
    alignSelf: 'center',
    marginVertical: isWeb ? 20 : 0,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
  },
  phoneFull: {
    flex: 1,
    borderRadius: 0,
    borderWidth: 0,
  },
  header: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingTop: isWeb ? 16 : 44,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backHomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backHomeIcon: {
    fontSize: 18,
    color: '#38bdf8',
    fontWeight: '800',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#f8fafc',
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  serverDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  dotGreen: { backgroundColor: '#34d399' },
  dotRed: { backgroundColor: '#f87171' },
  serverText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  roleBar: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderRadius: 10,
    padding: 3,
  },
  roleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  roleBtnActiveBlue: { backgroundColor: '#0284c7' },
  roleBtnActiveGreen: { backgroundColor: '#065f46' },
  roleBtnText: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 11,
  },
  roleBtnTextActive: { color: '#ffffff' },

  // App Body
  body: { flex: 1 },
  bodyContent: { padding: 14, gap: 14 },

  heroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38bdf8',
    marginRight: 5,
  },
  liveText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
  },
  etaChip: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  serviceCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 2,
  },
  bookingId: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 12,
  },
  techRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    gap: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetters: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  techNameText: {
    color: '#f1f5f9',
    fontWeight: '700',
    fontSize: 13,
  },
  techRatingText: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 1,
  },
  enRoutePill: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  enRouteText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '700',
  },
  mapArea: {
    height: 110,
    backgroundColor: '#020617',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 12,
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 8,
    position: 'relative',
  },
  radarRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.15)',
    top: 5,
    left: 40,
  },
  mapMarker: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mapMarkerTech: {
    backgroundColor: '#0284c7',
    alignSelf: 'flex-start',
  },
  mapMarkerHome: {
    backgroundColor: '#065f46',
    alignSelf: 'flex-end',
  },
  mapMarkerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  coordText: {
    color: '#64748b',
    fontSize: 9,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  callBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  callBtnText: {
    color: '#f1f5f9',
    fontWeight: '700',
    fontSize: 12,
  },
  chatBtn: {
    flex: 1,
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  chatBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },

  // Service Catalog inside app
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#cbd5e1',
  },
  catalogGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catCard: {
    width: '31%',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  catCardSelected: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  catIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  catName: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 10,
    textAlign: 'center',
  },
  catPrice: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  confirmCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  confirmTitle: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 8,
  },
  confirmBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },

  // Technician duty styles
  dutyCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  dutyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  consoleName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
  },
  consoleId: {
    fontSize: 11,
    color: '#34d399',
    fontWeight: '600',
    marginTop: 2,
  },
  dutyPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  dutyPillOn: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: '#059669',
  },
  dutyPillOff: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: '#dc2626',
  },
  dutyPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  statCell: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#38bdf8',
  },
  statKey: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#1e293b',
  },
  dispatchBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dispatchText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
  },
  urgentChip: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '700',
  },
  customerMeta: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  customerAddr: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 12,
  },
  gpsBtn: {
    backgroundColor: '#065f46',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#059669',
    marginBottom: 6,
  },
  gpsBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  gpsReadout: {
    color: '#34d399',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  stepperLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stepBtn: {
    flex: 1,
    backgroundColor: '#020617',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  stepBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  stepBtnText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '700',
  },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  upcomingId: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  upcomingSvc: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  upcomingAddr: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
  upcomingTime: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '800',
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingVertical: 8,
    paddingBottom: isWeb ? 8 : 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabIcon: {
    fontSize: 18,
    opacity: 0.4,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#38bdf8',
  },
});
