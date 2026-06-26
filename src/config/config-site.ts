/**
 * CONFIG SITE – Single file for all changeable site text and options.
 *
 * Edit this file to customize:
 * - Site name, server name, header, nav labels
 * - Footer (badge, tagline, description, Discord card, copyright, bottom taglines)
 * - Discord DMs (author name, accepted/rejected templates for whitelist, job, staff)
 * - Whitelist application questions
 * - City businesses (jobs list)
 * - Staff application questions
 */

/** Template for one application status in a Discord DM. */
export type DmStatusTemplate = {
  reasonDefault: string;
  nextSteps: readonly string[];
  footerNote: string;
};

/** DM template for one application type (whitelist, job, staff). */
export type DmApplicationTemplate = {
  accepted: DmStatusTemplate;
  rejected: DmStatusTemplate;
  deviceCheck?: DmStatusTemplate;
};

const CONFIG_SITE = {
  // ─── Site & branding ─────────────────────────────────────────────────────
  /** Display name of the server (DMs, footer, branding) */
  serverName: "Peach RP",

  /** Site name shown in the header */
  siteName: "Peach RP",

  /** Icon or short label next to site name in header */
  headerIcon: "RP",

  /** Nav label for the whitelist link (e.g. "Get Whitelisted") */
  whitelistNavLabel: "Get Whitelisted",

  /** Nav label for the public store page */
  storeNavLabel: "Store",

  /** Public Discord invite URL (footer "Connect" button and links) */
  discordInviteUrl: "https://discord.gg/SshDTEmsx",

  /** Discord server ID for the footer widget iframe (leave empty "" to hide the widget) */
  discordWidgetServerId: "",

  /** Homepage subtitle under the title (use {serverName} to insert the server name) */
  homepageSubtitle:
    "Welcome to {serverName} — a custom QBX FiveM roleplay server. Serious roleplay, an active staff team, and a growing community built for long-term stories. Apply for whitelist below to get started.",

  /** Store page title */
  storePageTitle: "Server Store",

  /** Store page description */
  storePageDescription:
    "Browse all items available for sale on the server. Admins can manage categories, prices, product titles, and images from the admin panel.",

  // ─── Top banner / ad bar ────────────────────────────────────────────────────
  /** Show the promotional banner at the very top of the site */
  topBannerEnabled: true,
  /** Label for the banner button (set empty string "" to hide the button) */
  topBannerCtaLabel: "Server Store",
  /** URL opened when clicking the banner button (falls back to discordInviteUrl if empty) */
  topBannerCtaUrl: "",
  /** Optional: cycle through multiple banner messages */
  topBannerMessages: [
    "Peach RP is live now — join the city and start your story today.",
    "Welcome to Peach RP — where your story begins. The city is now live.",
    "Your new life starts here. Peach RP is now live — enter the city today.",
    "Peach RP is LIVE — are you ready?",
  ],

  // ─── Footer ───────────────────────────────────────────────────────────────
  /** Small badge text above tagline (e.g.  or your brand) */
  footerBadgeLabel: "Peach RP",

  /** Uppercase tagline under the badge */
  footerTagline: "YOUR STORY STARTS HERE",

  /** Short description paragraph in the footer */
  footerDescription:
    "Experience immersive GTA V roleplay with custom systems, serious RP, and a tight-knit community.",

  /** Discord connect card: button text */
  footerConnectButtonText: "Connect to Discord",

  /** Discord connect card: short line above button (use {serverName} for server name) */
  footerConnectBlurb:
    "Join {serverName} on Discord to get whitelisted, ask questions, and stay updated.",

  /** Copyright line: "Not affiliated with …" */
  footerCopyrightNote: "Not affiliated with Rockstar Games or Take-Two Interactive.",

  /** Bottom bar left tagline (e.g. "RESPECT THE STREETS") */
  footerBottomTaglineLeft: "RESPECT THE STREETS",

  /** Bottom bar right tagline (e.g. "ROLEPLAY • COMMUNITY • STORIES") */
  footerBottomTaglineRight: "ROLEPLAY • COMMUNITY • STORIES",

  /** Section heading for footer nav column */
  footerNavHeading: "NAVIGATION",

  /** Section heading for footer Discord card */
  footerConnectHeading: "CONNECT",

  /** Discord card inner title (e.g. "DISCORD") */
  footerDiscordCardTitle: "DISCORD",

  // ─── Discord DM (author & templates) ──────────────────────────────────────
  /** Author name on Discord DM embeds (optional; falls back to serverName) */
  discordDmAuthorName: "𝑹𝑷",

  /** Discord DM templates for accepted/rejected messages (whitelist, job, staff) */
  dmTemplates: {
    whitelist: {
      accepted: {
        reasonDefault:
          "Your answers showed a solid grasp of roleplay and fit what we're looking for. Looking forward to seeing you in-game.",
        nextSteps: [
          "Hop into our Discord if you're not in yet",
          "Check #server-rules and get familiar with the guidelines",
          "Connect with your whitelisted account when you're ready",
        ],
        footerNote: "Read the rules before you jump in. Need help? Ask any staff member.",
      },
      rejected: {
        reasonDefault:
          "We couldn't approve it right now. Give our rules and guidelines another look; you're welcome to reapply when you're ready.",
        nextSteps: [
          "Review our server rules and community guidelines",
          "Apply again when you feel ready",
          "Questions? Message our staff on Discord",
        ],
        footerNote: "Thanks for your interest. We hope to see you apply again.",
      },
      deviceCheck: {
        reasonDefault:
          "Hello, we're waiting for you. We'll check your device before you enter the server. This is a daily routine and a security protocol specific to the server.",
        nextSteps: [
          "Wait for a staff member to contact you",
          "Make sure you are available on Discord for the device check",
          "Once the check is done, we will continue your access process",
        ],
        footerNote: "This device check is part of our normal daily server security routine.",
      },
    },
    job: {
      accepted: {
        reasonDefault:
          "Your application was a good fit for the role. Get in touch with your supervisor for the next steps.",
        nextSteps: [
          "Join our Discord if you aren't already in",
          "Check #city-jobs or staff channels for details",
          "Connect in-game and report to your supervisor as directed",
        ],
        footerNote: "Questions about the role? Staff can point you in the right direction.",
      },
      rejected: {
        reasonDefault:
          "We're not moving forward with this one right now. You can try other openings or reapply later.",
        nextSteps: [
          "Look at other jobs on the site",
          "Reapply when new positions open up",
          "Reach out to staff on Discord if you have questions",
        ],
        footerNote: "Thanks for applying. Best of luck.",
      },
    },
    staff: {
      accepted: {
        reasonDefault:
          "What you brought to the table fits what we need. A team lead will get you set up.",
        nextSteps: [
          "Get in our Discord if you're not already",
          "Read staff guidelines and rules in the right channels",
          "A team lead will contact you with your role and onboarding",
        ],
        footerNote:
          "Stuck on something? Your team lead or senior staff can help. See you on the team.",
      },
      rejected: {
        reasonDefault:
          "We're not approving it right now. You can reapply later if things change.",
        nextSteps: [
          "Have another look at our server and staff guidelines",
          "You can submit a new staff application when you're ready",
          "Questions? Hit up our staff on Discord",
        ],
        footerNote: "Thanks for wanting to help out. We appreciate it.",
      },
    },
    gang: {
      accepted: {
        reasonDefault:
          "Your gang application looks good. Leadership will reach out with next steps.",
        nextSteps: [
          "Stay active on Discord for leadership contact",
          "Review gang and criminal RP rules",
          "Wait for in-game onboarding from leadership",
        ],
        footerNote: "Questions? Contact gang leadership or staff on Discord.",
      },
      rejected: {
        reasonDefault:
          "We're not moving forward with this gang application right now.",
        nextSteps: [
          "Review our criminal RP and gang rules",
          "You may reapply later if openings remain",
          "Reach out on Discord if you have questions",
        ],
        footerNote: "Thanks for applying.",
      },
    },
  } as const satisfies Record<string, DmApplicationTemplate>,

  // ─── Whitelist application form questions ─────────────────────────────────
  whitelistApplicationQuestions: [
    { id: "inGameName", label: "Your in-game name", type: "text" as const, required: true, placeholder: "Your character name" },
    { id: "age", label: "Your age", type: "number" as const, required: true, placeholder: "18" },
    { id: "timezone", label: "Discord ID", type: "text" as const, required: true, placeholder: "Discord ID" },
    { id: "experience", label: "Why do you want to play on Peach RP?", type: "textarea" as const, required: true, placeholder: "Explain why you want to play on Peach RP" },
    { id: "motivation", label: "Who told you about Peach RP?", type: "textarea" as const, required: true, placeholder: "Example: A friend recommended it / I found it online" },
    { id: "characterStory", label: "How long have you been playing RP?", type: "textarea" as const, required: true, placeholder: "How long have you been playing RP, and what made you start?" },
    { id: "additionalInfo", label: "Did you read and memorize the rules?", type: "textarea" as const, required: false, placeholder: "Example: Yes, I memorized them / No, not yet" },
  ] as const,

  // ─── City businesses (jobs list) ───────────────────────────────────────────
  businesses: [
    { id: "peach-pd", name: "Peach PD", category: "EMERGENCY SERVICES", description: "Law enforcement" },
    { id: "peach-medical", name: "Peach Medical Center", category: "MEDICAL", description: "Hospital and EMS" },
    { id: "peach-realty", name: "Peach Realty", category: "BUSINESS", description: "Property sales and rentals" },
    { id: "peach-mechanics", name: "Peach Mechanics", category: "BUSINESS", description: "Vehicle repair and customization" },
    { id: "gun-plug", name: "Gun Plug", category: "CRIMINAL", description: "Underground firearms supply" },
    { id: "drug-plug", name: "Drug Plug", category: "CRIMINAL", description: "Underground narcotics supply" },
  ] as const,

  /** Display order for job department filters on the Jobs page */
  jobCategoryOrder: ["BUSINESS", "EMERGENCY SERVICES", "MEDICAL", "CRIMINAL"] as const,

  // ─── Job application form questions (per business id; edit in Admin → Forms) ─
  jobApplicationQuestions: {
    default: [
      { id: "in_game_name", label: "In-game name", type: "text" as const, required: true, placeholder: "Your character name" },
      { id: "experience", label: "Relevant experience for this role", type: "textarea" as const, required: true },
      { id: "availability", label: "When are you usually active?", type: "text" as const, required: true },
      { id: "why", label: "Why do you want this role?", type: "textarea" as const, required: true },
    ],
    "peach-pd": [
      { id: "in_game_name", label: "In-game name", type: "text" as const, required: true, placeholder: "Your character name" },
      { id: "age", label: "Character age", type: "number" as const, required: true, placeholder: "21" },
      { id: "experience", label: "Previous law enforcement RP experience", type: "textarea" as const, required: true },
      { id: "scenario", label: "Describe how you would handle a traffic stop", type: "textarea" as const, required: true },
      { id: "availability", label: "Hours per week you can patrol", type: "text" as const, required: true },
    ],
    "peach-medical": [
      { id: "in_game_name", label: "In-game name", type: "text" as const, required: true, placeholder: "Your character name" },
      { id: "certifications", label: "Medical certifications or training (RP)", type: "textarea" as const, required: true },
      { id: "experience", label: "Previous EMS / medical RP experience", type: "textarea" as const, required: true },
      { id: "scenario", label: "How would you treat a gunshot wound on scene?", type: "textarea" as const, required: true },
      { id: "availability", label: "When are you usually available for EMS?", type: "text" as const, required: true },
    ],
    "peach-realty": [
      { id: "in_game_name", label: "In-game name", type: "text" as const, required: true, placeholder: "Your character name" },
      { id: "experience", label: "Sales or real estate RP experience", type: "textarea" as const, required: true },
      { id: "communication", label: "How do you handle difficult clients?", type: "textarea" as const, required: true },
      { id: "availability", label: "Hours per week you can work", type: "text" as const, required: true },
    ],
    "gun-plug": [
      { id: "in_game_name", label: "In-game name", type: "text" as const, required: true, placeholder: "Your character name" },
      { id: "connections", label: "Who vouches for you in the city?", type: "textarea" as const, required: true },
      { id: "experience", label: "Previous criminal / plug RP experience", type: "textarea" as const, required: true },
      { id: "operations", label: "How would you run operations without heat?", type: "textarea" as const, required: true },
    ],
    "drug-plug": [
      { id: "in_game_name", label: "In-game name", type: "text" as const, required: true, placeholder: "Your character name" },
      { id: "connections", label: "Who vouches for you in the city?", type: "textarea" as const, required: true },
      { id: "experience", label: "Previous drug / plug RP experience", type: "textarea" as const, required: true },
      { id: "operations", label: "How would you distribute without drawing police?", type: "textarea" as const, required: true },
    ],
  } as const,

  // ─── Gang application form questions ───────────────────────────────────────
  gangApplicationQuestions: [
    { id: "gang_name", label: "Gang / set name", type: "text" as const, required: true, placeholder: "Your gang name" },
    { id: "in_game_name", label: "Your in-game name (leader or rep)", type: "text" as const, required: true },
    { id: "members", label: "How many active members do you have?", type: "number" as const, required: true, placeholder: "5" },
    { id: "territory", label: "What territory or turf are you claiming?", type: "textarea" as const, required: true },
    { id: "story", label: "Gang backstory and RP goals", type: "textarea" as const, required: true },
    { id: "rules", label: "Confirm you read criminal and gang RP rules", type: "select" as const, required: true, options: ["Yes, I read and agree", "Not yet"] },
  ] as const,

  // ─── Staff application form questions ──────────────────────────────────────
  staffApplicationQuestions: [
    { id: "role", label: "What made you want to join the Peach RP staff team?", type: "select" as const, required: true, options: ["Support", "Development", "PARTNERSHIP"] },
    { id: "age", label: "Age", type: "text" as const, required: true, placeholder: "e.g. 18" },
    { id: "experience", label: "Do you have previous staff experience?", type: "textarea" as const, required: false },
    { id: "availability", label: "How many hours can you be active as staff per day?", type: "text" as const, required: true },
    { id: "why", label: "If you have previous staff experience, tell us where exactly", type: "textarea" as const, required: true },
    { id: "additional", label: "If you become staff with us, what would your goal be?", type: "textarea" as const, required: false },
  ] as const,
} as const;

// Re-export as appConfig so existing imports keep working
export const appConfig = CONFIG_SITE;

export type StaffQuestion = (typeof appConfig.staffApplicationQuestions)[number];
export type WhitelistQuestion = (typeof appConfig.whitelistApplicationQuestions)[number];
export type Business = (typeof appConfig.businesses)[number];
