/* ------------------------------------------------------------------
 * مدل داده‌های نرم‌افزار قرارگاه مردمی مدافعان وطن — محله کرمان
 * ------------------------------------------------------------------ */

export type ID = string

export type MediaKind = 'image' | 'audio' | 'video' | 'external'

export interface MediaAsset {
  id: ID
  kind: MediaKind
  /** آدرس فایل: idb:<key> برای فایل‌های آپلودشده، یا URL کامل / مسیر داخل برنامه */
  url: string
  caption?: string
}

export interface NewsItem {
  id: ID
  title: string
  summary: string
  body: string
  image?: string
  date: string // ISO
  tags: string[]
  pinned: boolean
  published: boolean
}

export interface EventItem {
  id: ID
  title: string
  description: string
  image?: string
  /** زمان شروع به میلی‌ثانیه (برای مرتب‌سازی و یادآوری) */
  startsAt: number
  /** زمان پایان تقریبی (اختیاری) — برای نمایش «در حال برگزاری» */
  endsAt?: number
  location: string
  speaker?: string
  notify: boolean
  /** چند دقیقه قبل از شروع اعلان بدهد */
  reminderMinutes: number
  notifiedAt?: number
}

export interface ReportItem {
  id: ID
  title: string
  description: string
  type: 'photo' | 'audio' | 'video'
  cover?: string
  media: MediaAsset[]
  date: string // ISO
  eventDateText?: string
  published: boolean
}

export interface CooperationType {
  id: ID
  title: string
  description: string
  icon: string
  active: boolean
}

export type RequestStatus = 'new' | 'reviewed' | 'done'

export interface CooperationRequest {
  id: ID
  fullName: string
  phone: string
  age?: string
  neighborhood: string
  typeId: ID
  typeTitle: string
  availability: string
  skills: string
  note: string
  createdAt: string
  status: RequestStatus
}

export type MessageCategory = 'contact' | 'complaint' | 'suggestion' | 'praise'

export interface MessageItem {
  id: ID
  category: MessageCategory
  name: string
  phone: string
  subject: string
  body: string
  createdAt: string
  read: boolean
  starred: boolean
}

export interface BankAccount {
  id: ID
  bankName: string
  cardNumber: string
  sheba: string
  holder: string
  note?: string
}

export interface OnlineGateway {
  enabled: boolean
  provider: string
  /** الگوی آدرس درگاه؛ {amount} با مبلغ ریالی جایگزین می‌شود */
  linkTemplate: string
  note: string
}

export interface DonationConfig {
  intro: string
  amounts: number[]
  purposes: string[]
  accounts: BankAccount[]
  online: OnlineGateway
  receiptNote: string
}

export interface ContactChannel {
  id: ID
  role: string
  name: string
  phone: string
  hours: string
}

export interface NotificationLog {
  id: ID
  title: string
  body: string
  kind: 'news' | 'event' | 'report' | 'system'
  createdAt: string
  sentBy: 'admin' | 'system'
}

export interface AppSettings {
  orgName: string
  orgSubtitle: string
  motto: string
  aboutText: string
  address: string
  locationNote: string
  workHours: string
  heroImage: string
  heroTitle: string
  heroSubtitle: string
  /** مختصات هوای نمایش‌داده‌شده در صفحه اول (پیش‌فرض: تهران) */
  weather: {
    label: string
    city: string
    latitude: number
    longitude: number
  }
  notifications: {
    enabled: boolean
    leadOptions: number[]
    defaultLeadMinutes: number
    quietHours: { from: number; to: number; enabled: boolean }
  }
  adminPinHash: string
  socials: { label: string; url: string }[]
}

export interface AppState {
  schemaVersion: number
  updatedAt: string
  settings: AppSettings
  news: NewsItem[]
  events: EventItem[]
  reports: ReportItem[]
  cooperationTypes: CooperationType[]
  requests: CooperationRequest[]
  messages: MessageItem[]
  donation: DonationConfig
  contactChannels: ContactChannel[]
  notificationsLog: NotificationLog[]
}

export const SCHEMA_VERSION = 3

/* ------------------------------------------------------------------ */
/*  امکانات فرم همکاری                                                */
/* ------------------------------------------------------------------ */

export const COOPERATION_ICONS = [
  'HandHeart',
  'Camera',
  'HeartHandshake',
  'GraduationCap',
  'Share2',
  'Wallet',
  'Mic',
  'Utensils',
  'BookOpen',
  'Users',
] as const

/* ------------------------------------------------------------------ */
/*  داده‌های اولیه (قابل ویرایش کامل از پنل ادمین)                    */
/* ------------------------------------------------------------------ */

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY).toISOString()

/** شماره‌های نمونه که ادمین باید جایگزین کند (۰ برای تشخیص «تنظیم‌نشده») */
export const PLACEHOLDER_CARD = '0000-0000-0000-0000'
export const PLACEHOLDER_SHEBA = 'IR000000000000000000000000'

export function isPlaceholderAccount(a: BankAccount): boolean {
  return (
    a.cardNumber.replace(/\D/g, '').replace(/0/g, '').length === 0 &&
    a.sheba.replace(/\D/g, '').length < 4
  )
}

export function createSeedState(now = Date.now()): AppState {
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)

  const eventTonight = new Date(now)
  eventTonight.setHours(18, 30, 0, 0)
  const ceremony = new Date(now + 1 * DAY)
  ceremony.setHours(19, 30, 0, 0)
  const weekly = new Date(now + 3 * DAY)
  weekly.setHours(18, 0, 0, 0)
  const honoring = new Date(now + 6 * DAY)
  honoring.setHours(17, 0, 0, 0)
  const bloodDrive = new Date(now + 10 * DAY)
  bloodDrive.setHours(9, 0, 0, 0)

  return {
    schemaVersion: SCHEMA_VERSION,
    updatedAt: new Date(now).toISOString(),
    settings: {
      orgName: 'قرارگاه مردمی مدافعان وطن',
      orgSubtitle: 'محله کرمان',
      motto: 'با هم، برای هم؛ در خدمت محله',
      aboutText:
        'قرارگاه مردمی مدافعان وطن محله کرمان، تشکلی مردمی و خودجوش است که با تکیه بر ظرفیت اهالی محله، در حوزه‌های فرهنگی، خدماتی و حمایتی فعالیت می‌کند. خادمان این قرارگاه بدون هیچ چشم‌داشتی در مراسم‌ها، پویش‌های کمک مؤمنانه و برنامه‌های فرهنگی محله در کنار مردم هستند. هر ایرانی می‌تواند یک خادم باشد؛ کافی است یک قدم جلو بگذارد.',
      address: 'تهران، محله کرمان، پایگاه فرهنگی قرارگاه',
      locationNote: 'جنب مسجد جامع محله — طبقه همکف پایگاه فرهنگی',
      workHours: 'همه‌روزه، ۸ صبح تا ۱۰ شب',
      heroImage: 'media/hero.jpg',
      heroTitle: 'با هم برای هم، در خدمت محله',
      heroSubtitle: 'قرارگاه مردمی مدافعان وطن محله کرمان — خانه‌ای امن برای همه اهالی؛ از نذورات و مراسم تا گزارش‌ها و همکاری.',

      weather: {
        label: 'هوای تهران',
        city: 'تهران',
        latitude: 35.6892,
        longitude: 51.389,
      },
      notifications: {
        enabled: true,
        leadOptions: [30, 60, 120, 180, 720, 1440],
        defaultLeadMinutes: 120,
        quietHours: { enabled: false, from: 23, to: 7 },
      },
      adminPinHash: '',
      socials: [
        { label: 'ایتا', url: '' },
        { label: 'بله', url: '' },
        { label: 'اینستاگرام', url: '' },
      ],
    },
    news: [
      {
        id: 'news-1',
        title: 'آغاز پویش «مهربانی کرمان» برای تهیه بسته‌های معیشتی',
        summary:
          'با همت اهالی محله، پویش تهیه بسته‌های معیشتی برای ۱۲۰ خانوار نیازمند آغاز شد. هر بسته شامل اقلام اساسی یک ماه است.',
        body:
          'به گزارش روابط عمومی قرارگاه مردمی مدافعان وطن محله کرمان، پویش «مهربانی کرمان» از امروز آغاز شد.\n\nدر این پویش، خادمان قرارگاه با کمک اهالی محله بسته‌های معیشتی شامل برنج، روغن، حبوبات، ماکارونی، رب و اقلام بهداشتی تهیه می‌کنند. هر بسته برای مصرف یک ماه یک خانواده چهارنفره در نظر گرفته شده است.\n\nشما می‌توانید از بخش «نذورات و کمک‌ها» در همین نرم‌افزار، مبلغ دلخواه خود را برای این پویش اختصاص دهید یا اقلام اهدایی خود را به پایگاه قرارگاه تحویل دهید.\n\nقرارگاه از تمام اهالی محله کرمان که در این مسیر همراه خادمان هستند، سپاسگزار است.',
        image: 'media/news-aid.jpg',
        date: iso(-1),
        tags: ['پویش', 'خدمات محله'],
        pinned: true,
        published: true,
      },
      {
        id: 'news-2',
        title: 'ثبت‌نام دوره‌های آموزش قرآن و سبک زندگی خانواده آغاز شد',
        summary:
          'کلاس‌های قرائت و حفظ قرآن، مشاوره خانواده و کارگاه مهارت‌های زندگی برای همه سنین در پایگاه قرارگاه برگزار می‌شود.',
        body:
          'دوره‌های آموزشی پاییزه قرارگاه با حضور اساتید مجرب محله برگزار می‌شود.\n\nکلاس‌های قرائت و حفظ قرآن برای کودکان و نوجوانان، کارگاه‌های سبک زندگی و مشاوره خانواده برای بزرگسالان، و جلسات آموزش سواد رسانه برای والدین از جمله این دوره‌هاست.\n\nثبت‌نام از طریق بخش «فرم همکاری» و انتخاب گزینه «تیم فرهنگی و آموزشی» انجام می‌شود؛ خادمان ما در اولین فرصت با شما تماس می‌گیرند.',
        image: 'media/news-school.jpg',
        date: iso(-3),
        tags: ['آموزش', 'خانواده'],
        pinned: false,
        published: true,
      },
      {
        id: 'news-3',
        title: 'گزارش تصویری از غبارروبی مسجد جامع محله',
        summary:
          'جمعی از خادمان قرارگاه و اهالی محله کرمان، در آستانه مراسم هفتگی، مسجد جامع محله را غبارروبی کردند.',
        body:
          'به رسم هر هفته، خادمان قرارگاه مردمی مدافعان وطن همراه با نوجوانان محله، مسجد جامع را برای میزبانی از اهالی آماده کردند.\n\nتصاویر این برنامه در بخش «گزارش‌های تصویری» نرم‌افزار قابل مشاهده است.',
        image: 'media/report-courtyard.jpg',
        date: iso(-5),
        tags: ['گزارش تصویری', 'مسجد'],
        pinned: false,
        published: true,
      },
      {
        id: 'news-4',
        title: 'اطلاعیه: جابه‌جایی زمان برنامه هفتگی هیئت خادمان',
        summary:
          'از این هفته جلسه هفتگی هیئت خادمان به چهارشنبه‌ها ساعت ۱۸ در پایگاه فرهنگی قرارگاه برگزار می‌شود.',
        body:
          'با تصمیم شورای قرارگاه، زمان جلسه هفتگی هیئت خادمان از این هفته به روز چهارشنبه، ساعت ۱۸ تغییر کرد.\n\nحضور داوطلبان جدید در این جلسات آزاد است. برنامه جلسه شامل مرور فعالیت‌های هفته گذشته، تقسیم وظایف و بررسی درخواست‌های اهالی است.',
        date: iso(0),
        tags: ['اطلاعیه'],
        pinned: false,
        published: true,
      },
      {
        id: 'news-5',
        title: 'تجلیل از خادمان نمونه محله کرمان',
        summary:
          'در مراسمی با حضور اهالی، از خادمان نمونه قرارگاه که در طول سال در برنامه‌های محله همراه مردم بودند تقدیر شد.',
        body:
          'مراسم تجلیل از خادمان نمونه قرارگاه با حضور جمعی از اهالی محله در پایگاه فرهنگی برگزار شد.\n\nدر این مراسم از ۱۴ خادم فعال در بخش‌های پذیرایی، رسانه، پشتیبانی و خدمات محلی تقدیر شد.',
        image: 'media/report-tea.jpg',
        date: iso(-8),
        tags: ['مراسم', 'تقدیر'],
        pinned: false,
        published: true,
      },
    ],
    events: [
      {
        id: 'event-1',
        title: 'بازارچه خیریه اهالی محله کرمان',
        description:
          'با حضور خانواده‌ها، غرفه‌های صنایع دستی، غذای خانگی و بازی کودکان. عواید این بازارچه صرف بسته‌های معیشتی می‌شود.',
        image: 'media/event-family.jpg',
        startsAt: eventTonight.getTime(),
        endsAt: eventTonight.getTime() + 4 * HOUR,
        location: 'حیاط پایگاه فرهنگی قرارگاه',
        notify: true,
        reminderMinutes: 60,
      },
      {
        id: 'event-2',
        title: 'مراسم هفتگی سوگواری و سخنرانی',
        description:
          'مراسم هفتگی با مداحی، قرائت قرآن و سخنرانی کوتاه. پذیرایی با چای و شربت توسط خادمان قرارگاه انجام می‌شود.',
        image: 'media/event-ceremony.jpg',
        startsAt: ceremony.getTime(),
        endsAt: ceremony.getTime() + 2 * HOUR,
        location: 'مسجد جامع محله کرمان',
        speaker: 'با سخنرانی یکی از اساتید محله',
        notify: true,
        reminderMinutes: 120,
      },
      {
        id: 'event-3',
        title: 'جلسه هفتگی هیئت خادمان',
        description:
          'جلسه هم‌اندیشی خادمان: مرور برنامه‌های هفته گذشته، تقسیم وظایف مراسم پیش رو و بررسی پیشنهادهای اهالی. حضور داوطلبان جدید آزاد است.',
        startsAt: weekly.getTime(),
        endsAt: weekly.getTime() + 90 * 60 * 1000,
        location: 'پایگاه فرهنگی قرارگاه — سالن جلسات',
        notify: true,
        reminderMinutes: 60,
      },
      {
        id: 'event-4',
        title: 'همایش تجلیل از خانواده‌های شهدای محله',
        description:
          'همایش سالانه با حضور اهالی محله، خانواده‌های معظم شهدا و خادمان قرارگاه. اجرای سرود، روایتگری و پذیرایی.',
        image: 'media/event-family.jpg',
        startsAt: honoring.getTime(),
        endsAt: honoring.getTime() + 2.5 * HOUR,
        location: 'سالن اجتماعات سرای محله',
        notify: true,
        reminderMinutes: 720,
      },
      {
        id: 'event-5',
        title: 'پویش اهدای خون با همکاری پایگاه انتقال خون',
        description:
          'اتوبوس اهدای خون در جوار پایگاه قرارگاه مستقر می‌شود. برای پیشگیری از ازدحام، ثبت‌نام قبلی از طریق خادمان توصیه می‌شود.',
        startsAt: bloodDrive.getTime(),
        endsAt: bloodDrive.getTime() + 5 * HOUR,
        location: 'جوار پایگاه فرهنگی قرارگاه',
        notify: true,
        reminderMinutes: 1440,
      },
    ],
    reports: [
      {
        id: 'report-1',
        title: 'گزارش تصویری مراسم هفتگی محله کرمان',
        description:
          'قاب‌هایی از مراسم هفتگی اهالی محله؛ از چیدمان و پذیرایی خادمان تا لحظه‌های ناب همدلی. عکس‌ها: تیم رسانه قرارگاه.',
        type: 'photo',
        cover: 'media/report-courtyard.jpg',
        media: [
          { id: 'm-1', kind: 'image', url: 'media/report-courtyard.jpg', caption: 'حضور اهالی محله' },
          { id: 'm-2', kind: 'image', url: 'media/event-ceremony.jpg', caption: 'چیدمان سالن مراسم' },
          { id: 'm-3', kind: 'image', url: 'media/report-tea.jpg', caption: 'پذیرایی خادمان' },
        ],
        date: iso(-2),
        eventDateText: 'هفته گذشته',
        published: true,
      },
      {
        id: 'report-2',
        title: 'کاروان خدمت در حاشیه محله',
        description:
          'خادمان قرارگاه در قالب کاروان خدمت، بسته‌های معیشتی و اقلام ضروری را به خانواده‌های نیازمند محله رساندند.',
        type: 'photo',
        cover: 'media/report-convoy.jpg',
        media: [
          { id: 'm-4', kind: 'image', url: 'media/report-convoy.jpg', caption: 'حرکت کاروان خدمت' },
          { id: 'm-5', kind: 'image', url: 'media/news-aid.jpg', caption: 'بسته‌بندی اقلام' },
        ],
        date: iso(-6),
        eventDateText: 'دو هفته گذشته',
        published: true,
      },
      {
        id: 'report-3',
        title: 'فایل صوتی سخنرانی مراسم هفتگی',
        description:
          'نسخه صوتی سخنرانی با موضوع «همدلی و پیوند محله‌ای». مناسب برای شنیدن در مسیر خانه و محل کار.',
        type: 'audio',
        cover: 'media/report-tea.jpg',
        media: [
          {
            id: 'm-6',
            kind: 'audio',
            url: 'media/audio-sample.wav',
            caption: 'نمونه صوتی — جایگزین فایل اصلی سخنرانی شود',
          },
        ],
        date: iso(-4),
        eventDateText: 'هفته گذشته',
        published: true,
      },
      {
        id: 'report-4',
        title: 'ویدیو: آیین تقدیر از خادمان قرارگاه',
        description:
          'خلاصه ویدیویی مراسم تجلیل از خادمان نمونه محله کرمان همراه با گفت‌وگو با چند خادم.',
        type: 'video',
        cover: 'media/event-family.jpg',
        media: [
          {
            id: 'm-7',
            kind: 'external',
            url: 'https://www.aparat.com',
            caption: 'ویدیو در آپارات (لینک نمونه — از پنل مدیریت جایگزین کنید)',
          },
        ],
        date: iso(-8),
        eventDateText: 'دو هفته گذشته',
        published: true,
      },
    ],
    cooperationTypes: [
      {
        id: 'coop-1',
        title: 'خادم اجرایی مراسم',
        description: 'چیدمان، پذیرایی، نظم‌دهی و همراهی در مراسم‌های محله',
        icon: 'HandHeart',
        active: true,
      },
      {
        id: 'coop-2',
        title: 'تیم رسانه و تصویربرداری',
        description: 'عکاسی، فیلم‌برداری و تهیه گزارش‌های تصویری مراسم',
        icon: 'Camera',
        active: true,
      },
      {
        id: 'coop-3',
        title: 'تیم پشتیبانی و خدمات محلی',
        description: 'کمک در تهیه و توزیع بسته‌های معیشتی و خدمات به اهالی',
        icon: 'HeartHandshake',
        active: true,
      },
      {
        id: 'coop-4',
        title: 'تیم فرهنگی و آموزشی',
        description: 'همکاری در کلاس‌های قرآن، کارگاه خانواده و برنامه‌های فرهنگی',
        icon: 'GraduationCap',
        active: true,
      },
      {
        id: 'coop-5',
        title: 'تیم فضای مجازی و اطلاع‌رسانی',
        description: 'تولید محتوا، مدیریت شبکه‌های اجتماعی و اطلاع‌رسانی برنامه‌ها',
        icon: 'Share2',
        active: true,
      },
      {
        id: 'coop-6',
        title: 'حامی مالی و تهیه اقلام',
        description: 'همراهی مالی در پویش‌ها و تهیه اقلام مورد نیاز قرارگاه',
        icon: 'Wallet',
        active: true,
      },
    ],
    requests: [],
    messages: [],
    donation: {
      intro:
        'نذورات و کمک‌های شما صرف اطعام، بسته‌های معیشتی، هزینه مراسم‌ها و خدمات به اهالی محله می‌شود. هر مبلغی که در توان دارید، ارزشمند است. خادمان قرارگاه از شما سپاسگزارند.',
      amounts: [50000, 100000, 200000, 500000, 1000000, 2000000],
      purposes: [
        'نذورات و اطعام',
        'بسته‌های معیشتی',
        'کمک به خانواده‌های نیازمند',
        'هزینه‌های فرهنگی و مراسم',
        'سایر موارد',
      ],
      accounts: [
        {
          id: 'acc-1',
          bankName: 'بانک نمونه (تکمیل توسط ادمین)',
          cardNumber: PLACEHOLDER_CARD,
          sheba: PLACEHOLDER_SHEBA,
          holder: 'قرارگاه مردمی مدافعان وطن — محله کرمان',
          note: '',
        },
      ],
      online: {
        enabled: true,
        provider: 'درگاه پرداخت آنلاین',
        linkTemplate: '',
        note: 'پس از پرداخت، تصویر رسید را برای پیگیری به خادمان ارسال کنید.',
      },
      receiptNote:
        'پس از واریز، تصویر رسید پرداخت را از بخش «ارتباط با خادمان» برای ما ارسال کنید تا در سامانه ثبت شود.',
    },
    contactChannels: [
      {
        id: 'ch-1',
        role: 'دبیر قرارگاه',
        name: 'دفتر قرارگاه',
        phone: '۰۹۱۰ ۰۰۰ ۰۰۰۰',
        hours: 'همه‌روزه ۹ تا ۲۱',
      },
      {
        id: 'ch-2',
        role: 'پذیرش نذورات و کمک‌ها',
        name: 'واحد مالی قرارگاه',
        phone: '۰۹۱۰ ۰۰۰ ۰۰۰۰',
        hours: 'همه‌روزه ۱۰ تا ۲۰',
      },
      {
        id: 'ch-3',
        role: 'تیم رسانه و گزارش‌ها',
        name: 'واحد اطلاع‌رسانی',
        phone: '۰۹۱۰ ۰۰۰ ۰۰۰۰',
        hours: 'شنبه تا پنجشنبه ۱۰ تا ۱۸',
      },
    ],
    notificationsLog: [
      {
        id: 'notif-1',
        title: 'به نرم‌افزار قرارگاه خوش آمدید',
        body: 'از این پس مراسم، گزارش‌ها و پویش‌های محله کرمان را از همین‌جا پیگیری کنید.',
        kind: 'system',
        createdAt: iso(0),
        sentBy: 'system',
      },
    ],
  }
}
