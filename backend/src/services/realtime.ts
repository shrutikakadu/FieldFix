import type { Server } from 'socket.io';
import type { PrismaClient } from '@prisma/client';

let realtimeServer: Server | null = null;
let prisma: PrismaClient | null = null;

export const setRealtimeServer = (server: Server, database: PrismaClient) => { realtimeServer = server; prisma = database; };

export const notifyBookingChange = (booking: {
  id: string; status: string; customerId: string; technicianId: string | null;
}, message: string, options: { notifyTechnician?: boolean } = {}) => {
  if (!realtimeServer) return;
  const data = { bookingId: booking.id, status: booking.status, message, createdAt: new Date().toISOString() };
  realtimeServer.to(`booking_${booking.id}`).emit('booking:update', data);
  const recipients = options.notifyTechnician === false ? [booking.customerId] : [booking.customerId, booking.technicianId];
  for (const userId of new Set(recipients.filter(Boolean))) {
    realtimeServer.to(`user_${userId}`).emit('notification:new', data);
  }
  void sendExpoPush(recipients.filter((id): id is string => Boolean(id)), 'FieldFix booking update', message, { bookingId: data.bookingId });
};

export const notifyChatMessage = async (threadId: string, senderId: string, message: unknown) => {
  publishChatMessage(threadId, message);
  if (!threadId.startsWith('booking:')) return;
  try {
    const booking = await prisma?.booking.findUnique({
      where: { id: threadId.slice('booking:'.length) },
      select: { customerId: true, technicianId: true },
    });
    if (!booking) return;
    const recipients = [booking.customerId, booking.technicianId].filter((id): id is string => Boolean(id) && id !== senderId);
    const notice = { threadId, bookingId: threadId.slice('booking:'.length), message: 'New message in your booking chat.', createdAt: new Date().toISOString() };
    for (const userId of recipients) realtimeServer?.to(`user_${userId}`).emit('notification:new', notice);
    void sendExpoPush(recipients, 'New booking message', 'Open FieldFix to read the new message.', { threadId: notice.threadId, bookingId: notice.bookingId });
  } catch (error) {
    console.error('[Chat] Could not notify conversation participants:', error);
  }
};

async function sendExpoPush(userIds: string[], title: string, message: string, data: Record<string, string>) {
  if (userIds.length === 0) return;
  try {
    if (!prisma) return;
    const devices = await prisma.pushToken.findMany({ where: { userId: { in: [...new Set(userIds)] } }, select: { token: true } });
    if (!devices.length) return;
    for (let start = 0; start < devices.length; start += 100) {
      const batch = devices.slice(start, start + 100);
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'Accept-encoding': 'gzip, deflate' },
        body: JSON.stringify(batch.map(({ token }) => ({ to: token, title, body: message, data }))),
      });
      if (!response.ok) console.error(`[Push] Expo returned HTTP ${response.status}.`);
    }
  } catch (error) {
    console.error('[Push] Could not send Expo notification:', error);
  }
}

export const publishChatMessage = (threadId: string, message: unknown) => {
  realtimeServer?.to(`thread_${threadId}`).emit('chat:message', message);
};

export const threadRoom = (threadId: string) => `thread_${threadId}`;
