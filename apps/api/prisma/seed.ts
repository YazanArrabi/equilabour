/**
 * EquiLabour seed script
 *
 * All seed accounts use the @equilabour-seed.dev email domain so they are easy
 * to identify and remove before launch:
 *
 *   DELETE FROM "User" WHERE email LIKE '%@equilabour-seed.dev';
 *
 * Run:    pnpm --filter api prisma:seed
 * Clean:  pnpm --filter api prisma:unseed
 *
 * Default password for all seed accounts:  Seed2026!
 * Yazan's test company account            demo@equilabour-seed.dev / Demo2026!
 */

import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../generated/prisma/client.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SEED_DOMAIN = "@equilabour-seed.dev";
const DEFAULT_PASS = "Seed2026!";
const DEMO_PASS = "Demo2026!";
const SALT = 10;

async function h(pw: string) {
  return bcrypt.hash(pw, SALT);
}

async function main() {
  console.log("🌱  Seeding EquiLabour...\n");

  // ── Wipe existing seed data (idempotent re-runs) ──────────────────────────
  await prisma.user.deleteMany({ where: { email: { endsWith: SEED_DOMAIN } } });

  const pw = await h(DEFAULT_PASS);
  const demoPw = await h(DEMO_PASS);

  // ══════════════════════════════════════════════════════════════════════════
  // COMPANIES
  // ══════════════════════════════════════════════════════════════════════════

  // 1. Nexus Technologies — Istanbul
  const nexusUser = await prisma.user.create({
    data: {
      email: `hr${SEED_DOMAIN}`,
      passwordHash: pw,
      role: "company",
      phoneNumber: "+905550000001",
      emailVerified: true,
      phoneVerified: true,
      companyProfile: {
        create: {
          companyName: "Nexus Technologies",
          location: "Istanbul, Turkey",
          industry: "Software & Technology",
          contactInfo: `hr${SEED_DOMAIN} · +90 555 000 0001`,
          overview:
            "Nexus Technologies is a leading software house based in Istanbul, building enterprise-grade SaaS platforms for the MENA and European markets. With over 200 engineers, we deliver cloud-native solutions in fintech, logistics, and e-commerce. We believe in remote-first culture, continuous learning, and engineering excellence.",
        },
      },
    },
    include: { companyProfile: true },
  });
  const nexus = nexusUser.companyProfile!;

  // 2. Gulf Engineering Solutions — Dubai
  const gulfUser = await prisma.user.create({
    data: {
      email: `careers${SEED_DOMAIN}`,
      passwordHash: pw,
      role: "company",
      phoneNumber: "+971501000002",
      emailVerified: true,
      phoneVerified: true,
      companyProfile: {
        create: {
          companyName: "Gulf Engineering Solutions",
          location: "Dubai, UAE",
          industry: "Civil & Infrastructure Engineering",
          contactInfo: `careers${SEED_DOMAIN} · +971 50 100 0002`,
          overview:
            "Gulf Engineering Solutions is a full-service engineering consultancy headquartered in Dubai, delivering large-scale infrastructure, construction management, and MEP projects across the GCC. Our 500-strong team has delivered over AED 4 billion in projects across highways, mixed-use towers, and utility networks.",
        },
      },
    },
    include: { companyProfile: true },
  });
  const gulf = gulfUser.companyProfile!;

  // 3. Riyadh Capital Consulting — Riyadh
  const rccUser = await prisma.user.create({
    data: {
      email: `talent${SEED_DOMAIN}`,
      passwordHash: pw,
      role: "company",
      phoneNumber: "+966501000003",
      emailVerified: true,
      phoneVerified: true,
      companyProfile: {
        create: {
          companyName: "Riyadh Capital Consulting",
          location: "Riyadh, Saudi Arabia",
          industry: "Management & Strategy Consulting",
          contactInfo: `talent${SEED_DOMAIN} · +966 50 100 0003`,
          overview:
            "Riyadh Capital Consulting is a boutique management consulting firm advising sovereign wealth funds, family offices, and government entities across the Kingdom and wider GCC. Our practice areas include corporate strategy, digital transformation, and Vision 2030 alignment programs.",
        },
      },
    },
    include: { companyProfile: true },
  });
  const rcc = rccUser.companyProfile!;

  // 4. Aegean Digital — Izmir
  const aegeanUser = await prisma.user.create({
    data: {
      email: `jobs${SEED_DOMAIN}`,
      passwordHash: pw,
      role: "company",
      phoneNumber: "+902321000004",
      emailVerified: true,
      phoneVerified: true,
      companyProfile: {
        create: {
          companyName: "Aegean Digital",
          location: "Izmir, Turkey",
          industry: "Digital Product & UX",
          contactInfo: `jobs${SEED_DOMAIN} · +90 232 100 0004`,
          overview:
            "Aegean Digital is an Izmir-born product studio crafting high-conversion digital experiences for e-commerce, tourism, and healthtech clients across Turkey and Southern Europe. We blend design thinking with agile engineering to ship lovable products fast.",
        },
      },
    },
    include: { companyProfile: true },
  });
  const aegean = aegeanUser.companyProfile!;

  // 5. Yazan's demo company (your personal test account)
  // 5. Yazan's demo company (your personal test account)
  const demoUser = await prisma.user.create({
    data: {
      email: `demo${SEED_DOMAIN}`,
      passwordHash: demoPw,
      role: "company",
      phoneNumber: "+905559999999",
      emailVerified: true,
      phoneVerified: true,
      companyProfile: {
        create: {
          companyName: "EquiLabour Demo Co.",
          location: "Istanbul, Turkey",
          industry: "Recruitment Technology",
          contactInfo: `demo${SEED_DOMAIN}`,
          overview:
            "EquiLabour Demo Co. is a fast-growing HR-tech startup building the next generation of talent matching tools for the MENA and Mediterranean region. We help companies find the right engineers, managers, and creatives — faster, smarter, and with less friction.",
        },
      },
    },
    include: { companyProfile: true },
  });
  const demo = demoUser.companyProfile!;

  console.log("✅  Companies created (5)");

  // ══════════════════════════════════════════════════════════════════════════
  // WORKERS
  // ══════════════════════════════════════════════════════════════════════════

  const w1 = await prisma.user.create({
    data: {
      email: `ahmet.yilmaz${SEED_DOMAIN}`,
      passwordHash: pw,
      role: "worker",
      phoneNumber: "+905550000010",
      emailVerified: true,
      phoneVerified: true,
      workerProfile: {
        create: {
          fullName: "Ahmet Yılmaz",
          phoneNumber: "+905550000010",
          location: "Istanbul, Turkey",
          yearsOfExperience: 7,
          skills: ["Python", "Django", "FastAPI", "PostgreSQL", "Docker", "Redis", "AWS"],
          pastJobTitles: ["Backend Engineer", "Senior Python Developer", "Tech Lead"],
          workExperienceSummary:
            "7 years building scalable backend systems in Python. Led a team of 6 engineers at a Series B fintech startup to migrate a monolith to microservices, reducing API latency by 40%. Strong background in high-throughput event-driven architectures.",
          employmentHistory:
            "2022–present  Tech Lead, PayFlow Istanbul — Led backend guild, owned API platform serving 1.2M requests/day.\n2019–2022  Senior Python Developer, Getir Technology — Built rider dispatch engine handling 50k daily orders.\n2017–2019  Backend Engineer, Hepsiburada — Developed catalog and inventory microservices.",
        },
      },
    },
    include: { workerProfile: true },
  });

  const w2 = await prisma.user.create({
    data: {
      email: `fatima.alrashidi${SEED_DOMAIN}`,
      passwordHash: pw,
      role: "worker",
      phoneNumber: "+966501000011",
      emailVerified: true,
      phoneVerified: true,
      workerProfile: {
        create: {
          fullName: "Fatima Al-Rashidi",
          phoneNumber: "+966501000011",
          location: "Riyadh, Saudi Arabia",
          yearsOfExperience: 9,
          skills: ["PMP", "Agile", "Scrum", "Stakeholder Management", "Risk Management", "MS Project", "Jira"],
          pastJobTitles: ["Project Manager", "Senior Programme Manager", "PMO Lead"],
          workExperienceSummary:
            "PMP-certified project manager with 9 years' experience delivering complex infrastructure and digital transformation programmes for government and enterprise clients across Saudi Arabia. Managed portfolio budgets exceeding SAR 120M.",
          employmentHistory:
            "2021–present  PMO Lead, Saudi Digital Authority — Overseeing 12 concurrent digital government projects.\n2017–2021  Senior Programme Manager, Aramco Digital — Led ERP rollout across 8 business units.\n2015–2017  Project Manager, McKinsey & Company Riyadh — Delivered strategy execution for telco clients.",
        },
      },
    },
    include: { workerProfile: true },
  });

  const w3 = await prisma.user.create({
    data: {
      email: `omar.hassan${SEED_DOMAIN}`,
      passwordHash: pw,
      role: "worker",
      phoneNumber: "+971501000012",
      emailVerified: true,
      phoneVerified: true,
      workerProfile: {
        create: {
          fullName: "Omar Hassan",
          phoneNumber: "+971501000012",
          location: "Dubai, UAE",
          yearsOfExperience: 11,
          skills: ["Structural Engineering", "AutoCAD", "Revit", "BIM", "Project Management", "Primavera P6", "FIDIC Contracts"],
          pastJobTitles: ["Structural Engineer", "Senior Civil Engineer", "Design Manager"],
          workExperienceSummary:
            "Chartered civil engineer with 11 years in structural design and construction supervision for high-rise and mixed-use developments across the UAE and KSA. Delivered structural packages for three towers over 60 floors.",
          employmentHistory:
            "2020–present  Design Manager, AECOM Dubai — Leading structural design for a 72-floor residential tower in Business Bay.\n2015–2020  Senior Civil Engineer, WSP Global — Supervising civil works for Dubai Metro Route 2020.\n2013–2015  Structural Engineer, Dar Al-Handasah — Structural design of villa compounds in Abu Dhabi.",
        },
      },
    },
    include: { workerProfile: true },
  });

  const w4 = await prisma.user.create({
    data: {
      email: `elif.demir${SEED_DOMAIN}`,
      passwordHash: pw,
      role: "worker",
      phoneNumber: "+902321000013",
      emailVerified: true,
      phoneVerified: true,
      workerProfile: {
        create: {
          fullName: "Elif Demir",
          phoneNumber: "+902321000013",
          location: "Izmir, Turkey",
          yearsOfExperience: 5,
          skills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Figma", "GraphQL", "Storybook"],
          pastJobTitles: ["Frontend Developer", "UI Engineer", "Senior Frontend Developer"],
          workExperienceSummary:
            "Frontend specialist with 5 years turning Figma designs into pixel-perfect, accessible React applications. Passionate about design systems, performance, and component-driven development. Previously core contributor to an open-source Turkish UI library.",
          employmentHistory:
            "2022–present  Senior Frontend Developer, Yemeksepeti — Building consumer-facing order flow in React/Next.js.\n2021–2022  UI Engineer, Ikas Commerce — Designed and built merchant dashboard component library.\n2019–2021  Frontend Developer, Sahibinden — Feature development on Turkey's largest classifieds platform.",
        },
      },
    },
    include: { workerProfile: true },
  });

  const w5 = await prisma.user.create({
    data: {
      email: `karim.mansour${SEED_DOMAIN}`,
      passwordHash: pw,
      role: "worker",
      phoneNumber: "+971501000014",
      emailVerified: true,
      phoneVerified: true,
      workerProfile: {
        create: {
          fullName: "Karim Mansour",
          phoneNumber: "+971501000014",
          location: "Dubai, UAE",
          yearsOfExperience: 8,
          skills: ["Kubernetes", "AWS", "Terraform", "CI/CD", "GitHub Actions", "Prometheus", "Linux", "Python"],
          pastJobTitles: ["DevOps Engineer", "Cloud Infrastructure Engineer", "Site Reliability Engineer"],
          workExperienceSummary:
            "Senior DevOps and SRE professional with 8 years building cloud-native infrastructure on AWS and GCP. Reduced deployment lead time from 2 days to 12 minutes at a regional e-commerce company by implementing GitOps with ArgoCD.",
          employmentHistory:
            "2021–present  SRE, Noon.com Dubai — Maintaining 99.95% uptime SLA across 40+ microservices.\n2018–2021  Cloud Infrastructure Engineer, Careem — Migrated on-prem workloads to AWS EKS.\n2016–2018  DevOps Engineer, Majid Al Futtaim Technology — Automated deployment pipelines for retail systems.",
        },
      },
    },
    include: { workerProfile: true },
  });

  const w6 = await prisma.user.create({
    data: {
      email: `nour.alfarsi${SEED_DOMAIN}`,
      passwordHash: pw,
      role: "worker",
      phoneNumber: "+966501000015",
      emailVerified: true,
      phoneVerified: true,
      workerProfile: {
        create: {
          fullName: "Nour Al-Farsi",
          phoneNumber: "+966501000015",
          location: "Riyadh, Saudi Arabia",
          yearsOfExperience: 6,
          skills: ["Business Analysis", "Requirements Engineering", "SQL", "Power BI", "Stakeholder Management", "BPMN", "Agile"],
          pastJobTitles: ["Business Analyst", "Senior Business Analyst", "Product Analyst"],
          workExperienceSummary:
            "CBAP-certified business analyst bridging the gap between business stakeholders and engineering teams. 6 years in banking, insurance, and government sectors. Proficient in eliciting complex requirements and translating them into actionable user stories.",
          employmentHistory:
            "2022–present  Senior Business Analyst, Saudi National Bank — Digital banking product squad.\n2019–2022  Business Analyst, Tawuniya Insurance — Claims processing automation project.\n2018–2019  Product Analyst, Elm Company — National e-services platform.",
        },
      },
    },
    include: { workerProfile: true },
  });

  const w7 = await prisma.user.create({
    data: {
      email: `berk.kaya${SEED_DOMAIN}`,
      passwordHash: pw,
      role: "worker",
      phoneNumber: "+905550000016",
      emailVerified: true,
      phoneVerified: true,
      workerProfile: {
        create: {
          fullName: "Berk Kaya",
          phoneNumber: "+905550000016",
          location: "Istanbul, Turkey",
          yearsOfExperience: 4,
          skills: ["Python", "PyTorch", "Scikit-learn", "MLflow", "Spark", "SQL", "Airflow", "LLMs"],
          pastJobTitles: ["ML Engineer", "Data Scientist", "Machine Learning Engineer"],
          workExperienceSummary:
            "ML engineer focused on productionising NLP and recommendation models. Shipped a real-time product recommendation engine that lifted GMV by 18% at a top-3 Turkish e-commerce retailer. MSc in Computer Engineering from METU.",
          employmentHistory:
            "2023–present  ML Engineer, Trendyol — Building large-scale search relevance and personalisation models.\n2021–2023  Data Scientist, Turkcell — Churn prediction and upsell propensity modelling.\n2020–2021  Junior ML Engineer, Insider — Email send-time optimisation via reinforcement learning.",
        },
      },
    },
    include: { workerProfile: true },
  });

  const w8 = await prisma.user.create({
    data: {
      email: `sara.ahmed${SEED_DOMAIN}`,
      passwordHash: pw,
      role: "worker",
      phoneNumber: "+971501000017",
      emailVerified: true,
      phoneVerified: true,
      workerProfile: {
        create: {
          fullName: "Sara Ahmed",
          phoneNumber: "+971501000017",
          location: "Dubai, UAE",
          yearsOfExperience: 8,
          skills: ["Product Management", "OKRs", "Roadmapping", "User Research", "A/B Testing", "SQL", "Figma"],
          pastJobTitles: ["Product Manager", "Senior Product Manager", "Head of Product"],
          workExperienceSummary:
            "Product leader with 8 years shipping consumer and B2B products in fintech, proptech, and marketplace verticals across the UAE. Led product vision for a payments feature that processed AED 500M in its first year.",
          employmentHistory:
            "2022–present  Head of Product, Tabby — Owning BNPL merchant checkout product.\n2019–2022  Senior PM, Property Finder — Built advanced search and matching features.\n2016–2019  Product Manager, Souq.com / Amazon — Launched seller self-service tools in MENA.",
        },
      },
    },
    include: { workerProfile: true },
  });

  // w9 — fully populated profile used to seed a live AI analysis result
  const w9 = await prisma.user.create({
    data: {
      email: `yusuf.ozkan${SEED_DOMAIN}`,
      passwordHash: pw,
      role: "worker",
      phoneNumber: "+905550000018",
      emailVerified: true,
      phoneVerified: true,
      workerProfile: {
        create: {
          fullName: "Yusuf Özkan",
          phoneNumber: "+905550000018",
          location: "Istanbul, Turkey",
          yearsOfExperience: 9,
          skills: [
            "TypeScript", "Node.js", "React", "PostgreSQL", "Redis",
            "AWS", "Docker", "Kubernetes", "GraphQL", "System Design",
          ],
          pastJobTitles: [
            "Senior Software Engineer",
            "Staff Engineer",
            "Tech Lead",
            "Full-Stack Developer",
          ],
          workExperienceSummary:
            "Staff engineer with 9 years of end-to-end product experience across fintech and marketplace verticals. I architect and ship full-stack features in TypeScript — from React frontends to Node.js APIs to PostgreSQL schemas — while leading engineering teams of 5–10. Known for strong system design instincts, pragmatic technical decision-making, and a bias toward shipping working software over over-engineering.",
          employmentHistory:
            "2022–present  Staff Engineer, Papara — Leading the Payment Infrastructure squad. Architected a real-time transaction ledger processing 2M+ daily transactions; reduced p99 latency from 800ms to 95ms via Redis caching and query optimisation. Mentoring 6 engineers.\n\n2019–2022  Tech Lead, Trendyol — Led the Seller Growth team (8 engineers). Shipped a self-service onboarding flow that reduced seller activation time from 5 days to 4 hours and grew the active seller base by 22% in 12 months. Established team coding standards and led weekly architecture reviews.\n\n2017–2019  Senior Software Engineer, Peak Games — Full-stack feature development for social casino games serving 4M DAU. Built the in-game economy backend in Node.js with real-time event streaming via Kafka.\n\n2015–2017  Full-Stack Developer, Logo Software — Developed ERP modules for SME clients in React and .NET. First engineering role after graduating from Boğaziçi University BSc Computer Engineering (GPA 3.7).",
        },
      },
    },
    include: { workerProfile: true },
  });

  console.log("✅  Workers created (9)");

  if (process.env.ANTHROPIC_API_KEY) {
    console.log("🤖  Running AI analysis for Yusuf Özkan (this may take a moment)...");
    try {
      // Dynamic import defers evaluation of anthropic.ts until after dotenv has run
      const { analyzeWorkerProfile } = await import("../src/modules/ai/ai.service.js");
      await analyzeWorkerProfile(w9.workerProfile!.id);
      console.log("✅  AI analysis complete");
    } catch (err) {
      console.warn("⚠️   AI analysis failed (non-fatal):", err);
    }
  } else {
    console.warn("⚠️   ANTHROPIC_API_KEY not set — skipping AI analysis for Yusuf.");
    console.warn("    Add it to your .env and re-run: pnpm --filter api prisma:seed");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // JOB POSTINGS
  // ══════════════════════════════════════════════════════════════════════════

  const job1 = await prisma.jobPosting.create({
    data: {
      companyProfileId: nexus.id,
      title: "Senior Backend Engineer (Python)",
      description:
        "We are looking for a Senior Backend Engineer to join our Core Platform team in Istanbul. You will own the design and delivery of high-throughput APIs serving millions of daily requests for our fintech and logistics clients.\n\nResponsibilities:\n• Design, build, and maintain scalable Python services (Django / FastAPI)\n• Drive technical decisions and code reviews across the guild\n• Collaborate with product and infrastructure teams on architecture\n• Mentor junior engineers and uphold engineering standards\n\nWe offer hybrid working, competitive pay, private health insurance, and a learning budget.",
      requiredSkills: ["Python", "Django", "FastAPI", "PostgreSQL", "Docker", "AWS"],
      experienceLevel: "senior",
      employmentType: "full_time",
      location: "Istanbul, Turkey",
      payMin: 85000,
      payMax: 120000,
      status: "active",
    },
  });

  const job2 = await prisma.jobPosting.create({
    data: {
      companyProfileId: nexus.id,
      title: "Data Engineer",
      description:
        "Join our Data Platform team and help us build the pipelines, warehouses, and tooling that power analytics and ML across Nexus products.\n\nResponsibilities:\n• Design and maintain ELT pipelines using Airflow and Spark\n• Build and own the data warehouse on AWS Redshift\n• Partner with ML engineers to serve training datasets reliably\n• Define and enforce data quality standards\n\nRemote-friendly role with quarterly team gatherings in Istanbul.",
      requiredSkills: ["Python", "Spark", "Airflow", "SQL", "AWS", "dbt"],
      experienceLevel: "mid",
      employmentType: "full_time",
      location: "Istanbul, Turkey (Remote-friendly)",
      payMin: 70000,
      payMax: 100000,
      status: "active",
    },
  });

  const job3 = await prisma.jobPosting.create({
    data: {
      companyProfileId: nexus.id,
      title: "Machine Learning Engineer",
      description:
        "Nexus is expanding its AI product suite and needs an ML Engineer to take models from notebook to production. You will work alongside data scientists and product teams to ship intelligent features at scale.\n\nResponsibilities:\n• Build training and inference pipelines using PyTorch and MLflow\n• Deploy and monitor models on AWS SageMaker\n• Implement feature stores and real-time serving infrastructure\n• Champion ML best practices across the engineering org\n\nCompetitive equity package available.",
      requiredSkills: ["Python", "PyTorch", "MLflow", "AWS", "Kubernetes", "SQL"],
      experienceLevel: "mid",
      employmentType: "full_time",
      location: "Istanbul, Turkey",
      payMin: 80000,
      payMax: 115000,
      status: "active",
    },
  });

  const job4 = await prisma.jobPosting.create({
    data: {
      companyProfileId: gulf.id,
      title: "Senior Civil Engineer — Structures",
      description:
        "Gulf Engineering Solutions is seeking a Senior Civil Engineer to lead structural design and site supervision on a landmark mixed-use development in Dubai.\n\nResponsibilities:\n• Produce and review structural calculations and drawings\n• Manage BIM coordination with MEP and architectural teams\n• Represent GES during client and authority meetings\n• Supervise and mentor junior engineers on site\n\nVisa and relocation package provided for international candidates.",
      requiredSkills: ["Structural Engineering", "Revit", "BIM", "AutoCAD", "FIDIC Contracts"],
      experienceLevel: "senior",
      employmentType: "full_time",
      location: "Dubai, UAE",
      payMin: 90000,
      payMax: 125000,
      status: "active",
    },
  });

  const job5 = await prisma.jobPosting.create({
    data: {
      companyProfileId: gulf.id,
      title: "Project Manager — Infrastructure",
      description:
        "We are hiring an experienced Project Manager to oversee the delivery of a major utilities infrastructure programme across three Emirates.\n\nResponsibilities:\n• Own end-to-end project delivery: scope, schedule, budget, risk\n• Lead a cross-functional team of 30+ engineers and subcontractors\n• Manage client relationships and authority approvals\n• Produce monthly project reports for the board\n\nCompetitive package including housing allowance and annual flights.",
      requiredSkills: ["PMP", "Primavera P6", "Risk Management", "FIDIC Contracts", "Stakeholder Management"],
      experienceLevel: "senior",
      employmentType: "full_time",
      location: "Dubai, UAE",
      payMin: 100000,
      payMax: 140000,
      status: "active",
    },
  });

  const job6 = await prisma.jobPosting.create({
    data: {
      companyProfileId: rcc.id,
      title: "Management Consultant — Strategy",
      description:
        "Riyadh Capital Consulting is growing its Strategy practice and invites applications from high-calibre consultants with a passion for solving complex business problems in the Gulf.\n\nResponsibilities:\n• Lead client engagements from problem structuring to recommendation\n• Build financial models, business cases, and executive presentations\n• Manage junior consultants and project workstreams\n• Contribute to business development and proposal writing\n\nSignificant travel within KSA and GCC. MBA from a top institution preferred.",
      requiredSkills: ["Strategy Consulting", "Financial Modelling", "PowerPoint", "Stakeholder Management", "Agile"],
      experienceLevel: "senior",
      employmentType: "full_time",
      location: "Riyadh, Saudi Arabia",
      payMin: 110000,
      payMax: 160000,
      status: "active",
    },
  });

  const job7 = await prisma.jobPosting.create({
    data: {
      companyProfileId: rcc.id,
      title: "Senior Business Analyst",
      description:
        "Join RCC's Digital Government practice and help public sector clients across the Kingdom define and deliver transformational programmes aligned with Vision 2030.\n\nResponsibilities:\n• Elicit and document business and functional requirements\n• Facilitate workshops with senior stakeholders\n• Produce process maps, user stories, and acceptance criteria\n• Support UAT and change management activities\n\nKSA nationals and residents welcome. Arabic language is a plus.",
      requiredSkills: ["Business Analysis", "Requirements Engineering", "BPMN", "SQL", "Agile", "Power BI"],
      experienceLevel: "senior",
      employmentType: "full_time",
      location: "Riyadh, Saudi Arabia",
      payMin: 80000,
      payMax: 110000,
      status: "active",
    },
  });

  const job8 = await prisma.jobPosting.create({
    data: {
      companyProfileId: aegean.id,
      title: "Senior Frontend Developer (React)",
      description:
        "Aegean Digital is looking for a Senior Frontend Developer to drive the UI quality of our flagship e-commerce and healthtech products from our Izmir studio.\n\nResponsibilities:\n• Build fast, accessible, and beautifully crafted React interfaces\n• Own and evolve our internal design system\n• Collaborate daily with designers in Figma\n• Champion web performance and Core Web Vitals\n\nHybrid role (3 days Izmir office). International candidates may work fully remote for first 3 months.",
      requiredSkills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Figma", "Storybook"],
      experienceLevel: "senior",
      employmentType: "full_time",
      location: "Izmir, Turkey",
      payMin: 60000,
      payMax: 90000,
      status: "active",
    },
  });

  const job9 = await prisma.jobPosting.create({
    data: {
      companyProfileId: nexus.id,
      title: "DevOps / Platform Engineer",
      description:
        "Nexus is building out its Platform Engineering team to give our 200+ engineers the world-class developer experience they deserve. You'll own internal tooling, CI/CD, and cloud infrastructure.\n\nResponsibilities:\n• Design and operate Kubernetes clusters on AWS EKS\n• Build and maintain CI/CD pipelines with GitHub Actions\n• Drive infrastructure-as-code adoption with Terraform\n• Define SLOs and operate the observability stack (Prometheus, Grafana)\n\nOn-call rotation included with fair compensation.",
      requiredSkills: ["Kubernetes", "AWS", "Terraform", "GitHub Actions", "Prometheus", "Linux"],
      experienceLevel: "senior",
      employmentType: "full_time",
      location: "Istanbul, Turkey",
      payMin: 80000,
      payMax: 115000,
      status: "active",
    },
  });

  const job10 = await prisma.jobPosting.create({
    data: {
      companyProfileId: aegean.id,
      title: "Product Manager — E-commerce",
      description:
        "We're scaling our e-commerce product and need an experienced PM to own the buyer journey from discovery to post-purchase.\n\nResponsibilities:\n• Define and execute product roadmap for the core shopping experience\n• Run qualitative research and quantitative A/B experiments\n• Write clear PRDs and align engineering, design, and business stakeholders\n• Track KPIs and report to leadership weekly\n\nIdeal candidate has prior experience in marketplaces or consumer e-commerce.",
      requiredSkills: ["Product Management", "OKRs", "User Research", "A/B Testing", "SQL", "Figma"],
      experienceLevel: "mid",
      employmentType: "full_time",
      location: "Izmir, Turkey (Hybrid)",
      payMin: 65000,
      payMax: 95000,
      status: "active",
    },
  });

  console.log("✅  Job postings created (10)");

  // ══════════════════════════════════════════════════════════════════════════
  // APPLICATIONS
  // ══════════════════════════════════════════════════════════════════════════

  const apps = [
    // Ahmet — Python/backend
    {
      jobPostingId: job1.id, // Senior Backend Engineer (Nexus)
      workerProfileId: w1.workerProfile!.id,
      status: "accepted" as const,
      message:
        "I have been building high-throughput Python APIs for seven years and would love to contribute to Nexus Platform team. My most recent role at PayFlow involved owning an API layer serving 1.2M requests per day. I'd be excited to bring that experience to your team.",
    },
    {
      jobPostingId: job2.id, // Data Engineer (Nexus)
      workerProfileId: w1.workerProfile!.id,
      status: "rejected" as const,
      message:
        "While my primary background is backend engineering, I have significant hands-on experience with Spark, Airflow, and data modelling from cross-functional projects. I believe I could ramp up quickly in the data engineering domain.",
    },
    // Fatima — project management
    {
      jobPostingId: job5.id, // Project Manager Infrastructure (Gulf)
      workerProfileId: w2.workerProfile!.id,
      status: "pending" as const,
      message:
        "With 9 years managing government and enterprise programmes up to SAR 120M, I am confident I can bring rigour and stakeholder discipline to your infrastructure programme. I hold a PMP and have FIDIC contract experience from Aramco engagements.",
    },
    {
      jobPostingId: job6.id, // Management Consultant (RCC)
      workerProfileId: w2.workerProfile!.id,
      status: "accepted" as const,
      message:
        "My background spans PMO leadership for Saudi Digital Authority and strategic consulting at McKinsey Riyadh, which maps closely to RCC's practice. I am excited about contributing to Vision 2030 engagements.",
    },
    // Omar — civil engineering
    {
      jobPostingId: job4.id, // Senior Civil Engineer (Gulf)
      workerProfileId: w3.workerProfile!.id,
      status: "accepted" as const,
      message:
        "I am a Chartered Civil Engineer with 11 years in structural design for high-rise developments across the UAE and KSA. Having delivered structural packages for three towers over 60 floors, I am well-suited to your landmark mixed-use project.",
    },
    {
      jobPostingId: job5.id, // Project Manager Infrastructure (Gulf)
      workerProfileId: w3.workerProfile!.id,
      status: "pending" as const,
      message:
        "Beyond my technical engineering background, I have managed multidisciplinary teams and coordinated with authorities on large-scale projects. I believe I can step into a PM role with the right support from GES leadership.",
    },
    // Elif — frontend
    {
      jobPostingId: job8.id, // Senior Frontend (Aegean)
      workerProfileId: w4.workerProfile!.id,
      status: "pending" as const,
      message:
        "I am an Izmir-based senior frontend developer with deep React and TypeScript experience. I have built and maintained design systems at two previous companies and am a strong Figma collaborator. Aegean Digital's product culture resonates with me.",
    },
    {
      jobPostingId: job1.id, // Senior Backend Engineer (Nexus)
      workerProfileId: w4.workerProfile!.id,
      status: "rejected" as const,
      message:
        "While my specialisation is frontend, I have been expanding my backend skills in Python and would welcome a chance to move into a full-stack or backend role.",
    },
    // Karim — devops
    {
      jobPostingId: job9.id, // DevOps Platform Engineer (Nexus)
      workerProfileId: w5.workerProfile!.id,
      status: "accepted" as const,
      message:
        "I have spent 8 years building cloud-native infrastructure on AWS and Kubernetes for regional scale-ups. At Noon I maintain 99.95% SLA across 40+ microservices. I am eager to bring a SRE mindset to Nexus's platform engineering function.",
    },
    {
      jobPostingId: job3.id, // ML Engineer (Nexus)
      workerProfileId: w5.workerProfile!.id,
      status: "pending" as const,
      message:
        "My DevOps expertise covers ML infrastructure — SageMaker, Kubeflow, and feature serving. I am interested in bridging platform engineering and ML at Nexus.",
    },
    // Nour — business analysis
    {
      jobPostingId: job7.id, // Senior Business Analyst (RCC)
      workerProfileId: w6.workerProfile!.id,
      status: "pending" as const,
      message:
        "As a CBAP-certified business analyst with 6 years in banking and government, and current work at Saudi National Bank's digital squad, I am well positioned for RCC's Digital Government practice. Arabic fluent.",
    },
    // Berk — ML
    {
      jobPostingId: job3.id, // ML Engineer (Nexus)
      workerProfileId: w7.workerProfile!.id,
      status: "pending" as const,
      message:
        "I have been productionising NLP and recommendation models at Trendyol for the past year. I have hands-on experience with PyTorch, MLflow, and Spark-based feature pipelines. Excited about working on Nexus's AI product suite.",
    },
    {
      jobPostingId: job2.id, // Data Engineer (Nexus)
      workerProfileId: w7.workerProfile!.id,
      status: "accepted" as const,
      message:
        "My data engineering background — Airflow, Spark, and AWS Redshift — complements my ML work. I have built the data pipelines I then consumed for training, so I understand both sides of the platform.",
    },
    // Sara — product management
    {
      jobPostingId: job10.id, // PM E-commerce (Aegean)
      workerProfileId: w8.workerProfile!.id,
      status: "accepted" as const,
      message:
        "8 years shipping consumer and marketplace products in the UAE, most recently as Head of Product at Tabby. I know the MENA e-commerce customer deeply and have a strong track record with A/B experimentation and growth loops.",
    },
    {
      jobPostingId: job6.id, // Management Consultant (RCC)
      workerProfileId: w8.workerProfile!.id,
      status: "pending" as const,
      message:
        "My career has always sat at the intersection of product strategy and commercial outcomes. I am exploring a move into consulting and believe my experience launching AED 500M-processing products would translate well to RCC's client engagements.",
    },
  ];

  for (const app of apps) {
    await prisma.jobApplication.create({ data: app });
  }

  console.log("✅  Applications created (15)");

  // ══════════════════════════════════════════════════════════════════════════
  // DEMO COMPANY — jobs & applications (for Yazan to test company features)
  // ══════════════════════════════════════════════════════════════════════════

  const demoJob1 = await prisma.jobPosting.create({
    data: {
      companyProfileId: demo.id,
      title: "Full-Stack Engineer (Node.js / React)",
      description:
        "EquiLabour Demo Co. is hiring a Full-Stack Engineer to help us build and scale our core recruitment platform.\n\nResponsibilities:\n• Build and maintain REST APIs in Node.js / Express / TypeScript\n• Develop responsive React frontends with Tailwind CSS\n• Own features end-to-end from schema design to deployment\n• Participate in code reviews and architecture discussions\n\nHybrid role based in Istanbul. Equity included.",
      requiredSkills: ["Node.js", "React", "TypeScript", "PostgreSQL", "Tailwind CSS"],
      experienceLevel: "mid",
      employmentType: "full_time",
      location: "Istanbul, Turkey",
      payMin: 70000,
      payMax: 100000,
      status: "active",
    },
  });

  const demoJob2 = await prisma.jobPosting.create({
    data: {
      companyProfileId: demo.id,
      title: "Head of Talent Partnerships",
      description:
        "We're looking for a commercially sharp Head of Talent Partnerships to lead our employer relationships and grow the supply side of the EquiLabour marketplace.\n\nResponsibilities:\n• Own and grow a portfolio of 30+ enterprise employer accounts\n• Run end-to-end BD cycles: prospecting, demos, contracting\n• Feed product insights back from clients to the roadmap team\n• Build and mentor a team of two partnership managers\n\nThis is a senior IC-to-manager transition role. Strong preference for candidates with SaaS or HR-tech sales backgrounds.",
      requiredSkills: ["Business Development", "Account Management", "SaaS Sales", "Stakeholder Management", "CRM"],
      experienceLevel: "senior",
      employmentType: "full_time",
      location: "Istanbul, Turkey (Remote-friendly)",
      payMin: 90000,
      payMax: 130000,
      status: "active",
    },
  });

  const demoJob3 = await prisma.jobPosting.create({
    data: {
      companyProfileId: demo.id,
      title: "Product Designer (UX / UI)",
      description:
        "We want a Product Designer who cares deeply about hiring experiences — for both candidates and companies — to own the end-to-end design of the EquiLabour platform.\n\nResponsibilities:\n• Lead UX research: interviews, usability tests, journey mapping\n• Own and evolve the EquiLabour design system in Figma\n• Produce wireframes, prototypes, and polished high-fidelity designs\n• Collaborate daily with engineering to ensure pixel-perfect delivery\n\nPortfolio required. Candidates with marketplace or productivity tool experience preferred.",
      requiredSkills: ["Figma", "UX Research", "Prototyping", "Design Systems", "User Testing"],
      experienceLevel: "mid",
      employmentType: "full_time",
      location: "Istanbul, Turkey",
      payMin: 65000,
      payMax: 90000,
      status: "active",
    },
  });

  // Workers apply to the demo company jobs — all 3 statuses covered per job
  const demoApps = [
    // Full-Stack Engineer
    {
      jobPostingId: demoJob1.id,
      workerProfileId: w1.workerProfile!.id, // Ahmet — backend eng → good fit
      status: "accepted" as const,
      message:
        "I have 7 years of backend experience in Python and have been expanding into Node.js and TypeScript over the past year. I've shipped full-stack features end-to-end at PayFlow and am excited about the early-stage environment at EquiLabour Demo Co.",
    },
    {
      jobPostingId: demoJob1.id,
      workerProfileId: w4.workerProfile!.id, // Elif — frontend, applying for full-stack
      status: "pending" as const,
      message:
        "My React and TypeScript skills are production-grade. I've been growing my backend knowledge and have built simple Express APIs. I'm confident I can contribute across the stack and am drawn to the product mission.",
    },
    {
      jobPostingId: demoJob1.id,
      workerProfileId: w7.workerProfile!.id, // Berk — ML eng, stretch role
      status: "rejected" as const,
      message:
        "My background is primarily ML and Python, but I have built REST APIs to serve models and understand the full web stack. I'm keen to move into a more product-facing engineering role.",
    },
    // Head of Talent Partnerships
    {
      jobPostingId: demoJob2.id,
      workerProfileId: w2.workerProfile!.id, // Fatima — PM / programme manager → strong fit
      status: "pending" as const,
      message:
        "I've spent 9 years managing complex stakeholder portfolios across government and enterprise. While my background is on the delivery side, I've led vendor negotiations and commercial relationships throughout my career. I'm excited about making the transition to partnerships in HR-tech.",
    },
    {
      jobPostingId: demoJob2.id,
      workerProfileId: w8.workerProfile!.id, // Sara — product leader with commercial experience
      status: "pending" as const,
      message:
        "As Head of Product at Tabby I owned merchant relationships and ran commercial pilots directly with enterprise partners. I believe my product and business development experience translates well to this role.",
    },
    // Product Designer
    {
      jobPostingId: demoJob3.id,
      workerProfileId: w4.workerProfile!.id, // Elif — frontend / Figma experience
      status: "pending" as const,
      message:
        "I have 5 years of close collaboration with product designers and have owned design system implementation in code. I'm now looking to step into a full design role — I'm proficient in Figma and have led design QA on two major product launches.",
    },
    {
      jobPostingId: demoJob3.id,
      workerProfileId: w6.workerProfile!.id, // Nour — BA with user research background
      status: "rejected" as const,
      message:
        "As a business analyst I've facilitated UX workshops and contributed to wireframing sessions. I'm interested in transitioning into a formal design role and believe my research and requirements skills are a strong foundation.",
    },
  ];

  for (const app of demoApps) {
    await prisma.jobApplication.create({ data: app });
  }

  console.log("✅  Demo company jobs (3) and applications (7) created");

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`
╔══════════════════════════════════════════════════════════╗
║  EquiLabour seed complete                                ║
╠══════════════════════════════════════════════════════════╣
║  Password (all seed workers & companies): Seed2026!      ║
║                                                          ║
║  Your test company account (demo):                       ║
║    Email   : demo@equilabour-seed.dev                    ║
║    Password: Demo2026!                                   ║
║    Company : EquiLabour Demo Co.                         ║
║                                                          ║
║  To clean all seed data before launch:                   ║
║    pnpm --filter api prisma:unseed                       ║
╚══════════════════════════════════════════════════════════╝
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
