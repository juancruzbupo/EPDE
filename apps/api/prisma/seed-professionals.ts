// apps/api/prisma/seed-professionals.ts
// Seed for the professionals directory (ADR-018). Runs idempotently: if any
// professional with seed email already exists, skips seeding.

import { PrismaClient } from '@prisma/client';

const PROFESSIONAL_SEED_MARKER = 'pro.seed@epde.com';

interface ProfessionalSeed {
  name: string;
  email: string;
  phone: string;
  registrationNumber: string;
  registrationBody: string;
  specialties: Array<{ specialty: string; isPrimary: boolean }>;
  serviceAreas: string[];
  yearsOfExperience: number;
  tier: 'A' | 'B' | 'C' | 'BLOCKED';
  blockedReason: string | null;
  availability: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';
  matriculaExpiryDaysFromNow: number;
  ratings: Array<{ score: number; comment: string }>;
  tags: string[];
  notes: Array<string>;
  bio: string | null;
}

const professionals: ProfessionalSeed[] = [
  {
    name: 'Marcelo López',
    email: 'marcelo.lopez.pro.seed@epde.com',
    phone: '+5491155551001',
    registrationNumber: 'COPIME-12345',
    registrationBody: 'COPIME',
    specialties: [{ specialty: 'ELECTRICIAN', isPrimary: true }],
    serviceAreas: ['CABA Norte', 'CABA Centro'],
    yearsOfExperience: 15,
    tier: 'A',
    blockedReason: null,
    availability: 'AVAILABLE',
    matriculaExpiryDaysFromNow: 180,
    ratings: [
      { score: 5, comment: 'Excelente, puntual y prolijo' },
      { score: 5, comment: 'Resolvió el DPS rapidísimo' },
      { score: 4, comment: 'Buen trabajo, podría comunicar mejor' },
    ],
    tags: ['#confiable', '#puntual'],
    notes: [
      'Disponible todos los días excepto domingos.',
      'Acepta emergencias con recargo del 30%.',
    ],
    bio: 'Electricista matriculado con 15 años de experiencia en instalaciones residenciales y comerciales.',
  },
  {
    name: 'Julieta Ramírez',
    email: 'julieta.ramirez.pro.seed@epde.com',
    phone: '+5491155551002',
    registrationNumber: 'CPIC-98765',
    registrationBody: 'CPIC',
    specialties: [
      { specialty: 'ARCHITECT_ENGINEER', isPrimary: true },
      { specialty: 'DOCUMENTATION_NORMATIVE', isPrimary: false },
    ],
    serviceAreas: ['CABA Norte', 'Vicente López', 'San Isidro'],
    yearsOfExperience: 20,
    tier: 'A',
    blockedReason: null,
    availability: 'AVAILABLE',
    matriculaExpiryDaysFromNow: 365,
    ratings: [
      { score: 5, comment: 'Súper profesional, hace informes impecables' },
      { score: 5, comment: 'Evaluación estructural muy detallada' },
    ],
    tags: ['#confiable', '#premium'],
    notes: ['Agenda con 1-2 semanas de anticipación. Cobra visita inicial aparte.'],
    bio: 'Arquitecta con especialización en diagnóstico estructural y trámites municipales.',
  },
  {
    name: 'Roberto Díaz',
    email: 'roberto.diaz.pro.seed@epde.com',
    phone: '+5491155551003',
    registrationNumber: 'ENARGAS-4567',
    registrationBody: 'ENARGAS',
    specialties: [{ specialty: 'PLUMBER_GASFITTER', isPrimary: true }],
    serviceAreas: ['CABA Centro', 'CABA Sur'],
    yearsOfExperience: 12,
    tier: 'B',
    blockedReason: null,
    availability: 'AVAILABLE',
    matriculaExpiryDaysFromNow: 15,
    ratings: [
      { score: 4, comment: 'Buen trabajo con el termotanque' },
      { score: 3, comment: 'Llegó tarde pero resolvió' },
    ],
    tags: ['#gasista_matriculado'],
    notes: ['2026-03-15 — llegó 2hs tarde, dejó trabajo completo. Avisar al cliente del delay.'],
    bio: null,
  },
  {
    name: 'Natalia Fernández',
    email: 'natalia.fernandez.pro.seed@epde.com',
    phone: '+5491155551004',
    registrationNumber: 'ENARGAS-7891',
    registrationBody: 'ENARGAS',
    specialties: [{ specialty: 'PLUMBER_GASFITTER', isPrimary: true }],
    serviceAreas: ['Pilar', 'Tigre', 'Nordelta'],
    yearsOfExperience: 8,
    tier: 'A',
    blockedReason: null,
    availability: 'BUSY',
    matriculaExpiryDaysFromNow: 90,
    ratings: [{ score: 5, comment: 'Súper resolutiva y prolija' }],
    tags: ['#confiable', '#zona_norte'],
    notes: ['Ocupada hasta fin de mes.'],
    bio: 'Plomera y gasista matriculada, especializada en zona norte.',
  },
  {
    name: 'Héctor Romero',
    email: 'hector.romero.pro.seed@epde.com',
    phone: '+5491155551005',
    registrationNumber: 'MATR-ROOF-2020',
    registrationBody: 'Cámara Argentina de Impermeabilización',
    specialties: [{ specialty: 'ROOFER_WATERPROOFER', isPrimary: true }],
    serviceAreas: ['CABA Norte', 'Zona Norte GBA'],
    yearsOfExperience: 10,
    tier: 'B',
    blockedReason: null,
    availability: 'AVAILABLE',
    matriculaExpiryDaysFromNow: 120,
    ratings: [{ score: 4, comment: 'Cumplió con los tiempos acordados' }],
    tags: ['#impermeabilizador'],
    notes: [],
    bio: null,
  },
  {
    name: 'Ana Torres',
    email: 'ana.torres.pro.seed@epde.com',
    phone: '+5491155551006',
    registrationNumber: 'FUMIG-CABA-3344',
    registrationBody: 'Registro CABA de Control de Plagas',
    specialties: [{ specialty: 'PEST_CONTROL', isPrimary: true }],
    serviceAreas: ['CABA Centro', 'CABA Sur', 'La Plata'],
    yearsOfExperience: 6,
    tier: 'B',
    blockedReason: null,
    availability: 'AVAILABLE',
    matriculaExpiryDaysFromNow: 60,
    ratings: [{ score: 4, comment: 'Muy prolija. Explica bien qué hace.' }],
    tags: ['#detallista'],
    notes: ['Prefiere agendar citas matutinas.'],
    bio: null,
  },
  {
    name: 'Diego Martínez',
    email: 'diego.martinez.pro.seed@epde.com',
    phone: '+5491155551007',
    registrationNumber: 'HVAC-CALA-2019',
    registrationBody: 'Cámara Argentina del Aire Acondicionado',
    specialties: [{ specialty: 'HVAC_TECHNICIAN', isPrimary: true }],
    serviceAreas: ['CABA Norte', 'CABA Centro', 'Vicente López'],
    yearsOfExperience: 7,
    tier: 'C',
    blockedReason: null,
    availability: 'AVAILABLE',
    matriculaExpiryDaysFromNow: 240,
    ratings: [
      { score: 3, comment: 'Trabajo aceptable pero caro' },
      { score: 2, comment: 'Cotizó 40% más que otros dos' },
    ],
    tags: ['#caro'],
    notes: ['Solo usar si no hay más opciones. Cotización alta.'],
    bio: null,
  },
  {
    name: 'Sergio Galván',
    email: 'sergio.galvan.pro.seed@epde.com',
    phone: '+5491155551008',
    registrationNumber: 'N/A',
    registrationBody: 'N/A',
    specialties: [{ specialty: 'PAINTER', isPrimary: true }],
    serviceAreas: ['CABA'],
    yearsOfExperience: 20,
    tier: 'BLOCKED',
    blockedReason:
      'Abandonó un trabajo a mitad (marzo 2026, cliente Pérez). No volver a contratar.',
    availability: 'UNAVAILABLE',
    matriculaExpiryDaysFromNow: -30,
    ratings: [{ score: 1, comment: 'Abandonó el trabajo sin avisar' }],
    tags: ['#evitar'],
    notes: ['🚨 NO VOLVER A CONTRATAR — abandono de trabajo confirmado.'],
    bio: null,
  },
];

export async function seedProfessionals(prisma: PrismaClient, adminId: string): Promise<void> {
  const existing = await prisma.professional.findFirst({
    where: { email: { endsWith: '.pro.seed@epde.com' } },
    select: { id: true },
  });
  if (existing) {
    console.log('⏭️  Professionals seed already applied (marker found), skipping.');
    return;
  }

  console.log(`👷 Seeding ${professionals.length} professionals...`);

  for (const seed of professionals) {
    const now = new Date();
    const matriculaExpires = new Date(now);
    matriculaExpires.setDate(matriculaExpires.getDate() + seed.matriculaExpiryDaysFromNow);

    const professional = await prisma.professional.create({
      data: {
        name: seed.name,
        email: seed.email,
        phone: seed.phone,
        bio: seed.bio,
        registrationNumber: seed.registrationNumber,
        registrationBody: seed.registrationBody,
        serviceAreas: seed.serviceAreas,
        yearsOfExperience: seed.yearsOfExperience,
        tier: seed.tier,
        blockedReason: seed.blockedReason,
        availability: seed.availability,
        createdBy: adminId,
        specialties: {
          create: seed.specialties.map((s) => ({
            specialty: s.specialty as
              | 'ELECTRICIAN'
              | 'PLUMBER_GASFITTER'
              | 'ARCHITECT_ENGINEER'
              | 'ROOFER_WATERPROOFER'
              | 'PEST_CONTROL'
              | 'HVAC_TECHNICIAN'
              | 'FIRE_SAFETY'
              | 'DOCUMENTATION_NORMATIVE'
              | 'PAINTER'
              | 'SOLAR_SPECIALIST'
              | 'WATER_TECHNICIAN'
              | 'CARPENTER'
              | 'LANDSCAPER',
            isPrimary: s.isPrimary,
          })),
        },
        attachments: {
          create: [
            {
              type: 'MATRICULA',
              url:
                'https://placehold.co/600x400/png?text=Matricula+' + encodeURIComponent(seed.name),
              fileName: `matricula-${seed.registrationNumber}.pdf`,
              expiresAt: matriculaExpires,
              verifiedAt: seed.tier !== 'BLOCKED' ? now : null,
              verifiedBy: seed.tier !== 'BLOCKED' ? adminId : null,
            },
          ],
        },
        ratings: {
          create: seed.ratings.map((r) => ({
            authorId: adminId,
            score: r.score,
            adminComment: r.comment,
          })),
        },
        tags: {
          create: seed.tags.map((t) => ({ tag: t })),
        },
        timelineNotes: {
          create: seed.notes.map((content) => ({ authorId: adminId, content })),
        },
      },
    });

    console.log(
      `  ✓ ${professional.name} (${seed.specialties[0]?.specialty}, tier ${seed.tier}, ${seed.serviceAreas.length} zonas)`,
    );
  }

  console.log(`✅ Professionals seeded (${professionals.length}).`);
}

export { PROFESSIONAL_SEED_MARKER };
