import { PrismaClient } from '@prisma/client';

const activeStatuses = ['AWAITING_PAYMENT', 'PENDING', 'ACCEPTED', 'DISPATCHED', 'IN_PROGRESS'];

const hasSkill = (skillsJson: string, requestedSkill: string): boolean => {
  try {
    const skills: unknown = JSON.parse(skillsJson);
    return Array.isArray(skills) && skills.some(skill =>
      typeof skill === 'string' && skill.trim().toLowerCase() === requestedSkill.trim().toLowerCase(),
    );
  } catch {
    return false;
  }
};

export const findDispatchCandidate = async (
  prisma: PrismaClient,
  service: string,
  city: string,
) => {
  const profiles = await prisma.technicianProfile.findMany({
    where: { isAvailable: true, city: { equals: city, mode: 'insensitive' } },
    include: { user: { select: { id: true, name: true } } },
  });
  const qualified = profiles.filter(profile => hasSkill(profile.skills, service));
  if (qualified.length === 0) return null;

  const loads = await prisma.booking.groupBy({
    by: ['technicianId'],
    where: { technicianId: { in: qualified.map(profile => profile.userId) }, status: { in: activeStatuses } },
    _count: { _all: true },
  });
  const activeLoadByTechnician = new Map(
    loads.map(load => [load.technicianId, load._count._all]),
  );

  qualified.sort((left, right) =>
    (activeLoadByTechnician.get(left.userId) || 0) - (activeLoadByTechnician.get(right.userId) || 0) ||
    right.rating - left.rating ||
    left.totalJobs - right.totalJobs ||
    left.userId.localeCompare(right.userId),
  );

  const selected = qualified[0];
  return {
    id: selected.user.id,
    name: selected.user.name,
    city: selected.city,
    specialization: selected.specialization,
    rating: selected.rating,
    totalJobs: selected.totalJobs,
    activeJobs: activeLoadByTechnician.get(selected.userId) || 0,
  };
};
