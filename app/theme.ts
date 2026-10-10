// app/theme.ts — ระบบสีและตัวอักษรของเกม
//
// **พาเลตต์นี้ดึงมาจากงานอาร์ตที่มีอยู่จริง ไม่ได้คิดขึ้นใหม่**
//
// ภาพปก (`startPage.png`) กับฉาก (`swamp.png`, `battleScence1.png`) เป็นงานเขียน
// ด้วยดินสอ/ถ่าน โทนดินเผา-เขียวมะกอก บนกระดาษเก่า มีแสงเดียวคือแสงจันทร์อุ่นๆ
// และมีแดงเลือดหมูเป็นสีเน้นในภาพปกเท่านั้น
//
// ก่อนหน้านี้ UI ใช้สีจากพาเลตต์เว็บ 40 กว่าสี (ฟ้า #93c5fd, ม่วง #c4b5fd,
// เขียว #4ade80, แดง #ef4444 …) วางทับงานแบบนั้น — เหมือนเอาแดชบอร์ดเว็บ
// ไปแปะบนโปสเตอร์หนังผีไทยยุคเจ็ดศูนย์ สีพวกนั้นไม่มีอยู่ในภาพเลยสักสี
//
// กติกาของพาเลตต์นี้: **สีเน้นมีสองสีเท่านั้น** — ทองแสงจันทร์ กับ แดงเลือดหมู
// สถานะต่างๆ แยกกันด้วยไอคอนและน้ำหนักตัวอักษร ไม่ใช่ด้วยการแจกสีคนละสี
// การแจกสีรุ้งคือสิ่งที่ทำให้หน้าจอดูเป็นเว็บแอป ไม่ใช่หนังสือเก่า

export const palette = {
  // ── หมึกและเงา (มาจากส่วนมืดของฉาก)
  ink:        '#14100a',   // ดำอมน้ำตาล ใช้เป็นพื้นหลังสุดท้าย
  inkSoft:    '#1d1810',
  umber:      '#241d10',   // น้ำตาลไหม้ ใช้เป็นพื้นแผง
  olive:      '#2c2a17',   // เขียวมะกอกเข้ม เงาในฉาก

  // ── กระดาษ (มาจากพื้นโปสเตอร์และเนื้อกรอบ)
  paperDeep:  '#5c4a1d',
  paper:      '#8a7331',   // สีเนื้อกรอบและพื้นโปสเตอร์
  paperLight: '#c9ab5f',

  // ── แสงจันทร์ (แสงเดียวในทุกฉาก — เป็นสีเน้นหลัก)
  moon:       '#f0dfa0',
  moonDim:    '#c9ab5f',

  // ── เลือด (สีเน้นรอง ใช้กับอันตรายและ HP เท่านั้น)
  blood:      '#c4462a',
  bloodDeep:  '#8c2c17',
  /** สว่างกว่า `blood` หนึ่งขั้น สำหรับตัวเลขดาเมจที่ต้องเด้งออกจากฉากมืด */
  bloodLit:   '#e0603a',

  // ── ตัวอักษร
  text:       '#e8dcc0',   // สีกระดูก อ่านบนพื้นมืด
  textDim:    'rgba(232,220,192,0.82)',
  textFaint:  'rgba(232,220,192,0.64)',

  // ── เส้นขอบ
  line:       'rgba(201,171,95,0.26)',
  lineStrong: 'rgba(240,223,160,0.55)',

  // ── ม่านทับฉาก (ให้ตัวอักษรอ่านออกบนภาพ)
  scrim:      'rgba(12,9,5,0.72)',
  scrimHeavy: 'rgba(12,9,5,0.86)',
  /** ทึบสุด ใช้กับจอที่ต้องหยุดทุกอย่าง เช่น แพ้/ชนะ */
  scrimFull:  'rgba(12,9,5,0.93)',

  /** เงาใต้ตัวอักษรที่วางบนภาพ */
  shadow:     'rgba(12,9,5,0.85)',
} as const;

/** พื้นผิวของแผงต่างๆ — โปร่งเล็กน้อยเพื่อให้เห็นฉากข้างหลังราง ๆ */
export const surface = {
  panel:      'rgba(36,29,16,0.90)',
  panelRaise: 'rgba(58,47,25,0.92)',
  panelSunk:  'rgba(20,16,10,0.72)',
  panelDim:   'rgba(20,16,10,0.55)',
  panelWell:  'rgba(20,16,10,0.62)',
  panelDeep:  'rgba(20,16,10,0.75)',
  /** แผงที่ถูกเลือกอยู่ */
  panelActive:'rgba(90,72,32,0.92)',
  /** แผงลอยบนฉากตอนสู้ — บางกว่าแผงปกติ เพื่อไม่ให้บังฉาก */
  glass:      'rgba(12,9,5,0.60)',
  glassDim:   'rgba(12,9,5,0.42)',
} as const;

/**
 * สีเน้นแบบโปร่ง
 *
 * มีชื่อให้เรียกแทนที่จะเขียน `rgba(240,223,160,0.16)` กระจายตามไฟล์
 * ไม่ใช่แค่เรื่องความสวย — ค่าที่เขียนตรงๆ คือค่าที่ไม่มีใครรู้ว่าตั้งใจให้เป็นสีอะไร
 * และเป็นทางที่สีนอกระบบไหลกลับเข้ามาได้ง่ายที่สุด
 */
export const tint = {
  moonFaint: 'rgba(240,223,160,0.10)',
  moonSoft:  'rgba(240,223,160,0.16)',
  moonPick:  'rgba(240,223,160,0.20)',
  bloodSoft: 'rgba(196,70,42,0.18)',
  bloodLine: 'rgba(196,70,42,0.55)',
  bloodHint: 'rgba(196,70,42,0.50)',
} as const;

/**
 * ตัวอักษร
 *
 * `display` / `ui` ใช้ Prompt — น้ำหนักหนักๆ ของมันอ่านเป็นตัวโปสเตอร์ได้
 * `body` ใช้ THSarabun ซึ่งเป็นตัวหนังสือแบบเอกสาร/หนังสือไทย — เหมาะกับเนื้อเรื่อง
 * ที่ต้องอ่านยาว และให้ความรู้สึกงานพิมพ์เก่ากว่าตัว sans
 *
 * ไฟล์ THSarabun อยู่ใน `assets/fonts/` มาตั้งแต่ต้นโปรเจกต์แต่ไม่เคยถูกโหลดเลย
 * ส่วน ChakraPetch ที่เคยใช้กับตัวเลขสถานะเป็นตัวอักษรทรงเหลี่ยมแนวเทคโน
 * ซึ่งขัดกับงานอาร์ตทั้งหมด จึงเลิกใช้
 */
export const font = {
  display: 'Prompt_700Bold',
  heading: 'Prompt_600SemiBold',
  ui:      'Prompt_400Regular',
  uiMed:   'Prompt_600SemiBold',
  body:    'THSarabun',
  bodyBold:'THSarabunBold',
} as const;

/** ขนาดตัวอักษร — ไล่เป็นขั้น ไม่ใช่ตัวเลขสุ่มรายจุด */
export const size = {
  display: 26,
  title:   21,
  heading: 17,
  bodyLg:  19,   // THSarabun ตัวเล็กกว่าตาเห็นจริงประมาณหนึ่งขั้น จึงตั้งใหญ่กว่า
  body:    17,
  ui:      14,
  label:   12,
  tiny:    10,
} as const;

export const space = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
} as const;

export const radius = {
  sm: 3, md: 4, lg: 5, pill: 999,
} as const;

/**
 * ลำดับชั้นการซ้อน
 *
 * โอเวอร์เลย์ต้องอยู่เหนือแถบสถานะเสมอ — `DeckView`/`BlessingView` เขียน
 * `zIndex: 2000` ไว้ตรงๆ อยู่แล้วและถูกต้อง แต่ `ShopView`/`StoryEventView`
 * ไม่ได้เขียน ทั้งที่ถูกวางไว้ก่อน `PlayerStatusBar` ใน JSX แถบสถานะจึงทับ
 * ปุ่ม "เดินทางต่อ" กับ "ทำลายทิ้ง" ที่ก้นหน้าร้านจนกดไม่ได้
 *
 * มีชื่อให้เรียกแทนที่จะพิมพ์ 2000 กระจายตามไฟล์ — เลขที่เขียนตรงๆ คือเลขที่
 * ไม่มีใครรู้ว่าต้องสัมพันธ์กับอะไร และเป็นทางที่ของหลุดลำดับกลับเข้ามาง่ายที่สุด
 */
export const layer = {
  /** ของที่ซ้อนกันภายในคอมโพเนนต์เดียว (เลขค่าร่ายบนมุมการ์ด) */
  badge: 10,
  /** แถบสถานะผู้เล่นบนแผนที่ */
  statusBar: 100,
  /** ของประดับบนฉากต่อสู้ (แถบสถานะ แถวผี) — เหนือฉาก ใต้ทุกอย่างที่กดได้ */
  decor: 200,
  /** โอเวอร์เลย์ในไฟต์ที่ยังให้เห็นฉากราง ๆ (แฟลชจอ ทิ้งการ์ด ชนะ/แพ้) */
  battleOverlay: 500,
  /** ปุ่มมุมจอในไฟต์ (ดูกอง เร่งอนิเมชั่น) */
  control: 600,
  /** ตัวเลขดาเมจที่เด้ง — ต้องอ่านออกทับทุกอย่างในฉาก */
  popup: 999,
  /** โอเวอร์เลย์เต็มจอ — เหนือทุกอย่างรวมถึงแถบสถานะ */
  overlay: 2000,
  settings:3000,
} as const;

/**
 * ช่องต่างๆ บนกรอบการ์ด `assets/encounters/bgEnNormal.png`
 *
 * กรอบนี้ออกแบบช่องมาให้แล้ว — แถบชื่อด้านบน ช่องภาพใหญ่ ช่องคำบรรยาย
 * และแถบล่างสำหรับปุ่ม แต่โค้ดเดิมวางเนื้อหาด้วย marginTop สุ่มๆ ไม่ตรงช่องเลย
 * ค่าพวกนี้เป็นสัดส่วนของความสูงการ์ด วัดจากตัวไฟล์ภาพ
 */
export const encounterFrame = {
  ratio: 850 / 1540,        // กว้าง/สูง ของไฟล์ต้นฉบับ
  titleTop:   0.105,
  titleH:     0.075,
  artTop:     0.205,
  artH:       0.375,
  descTop:    0.615,
  descH:      0.205,
  footerTop:  0.855,
  footerH:    0.080,
  insetX:     0.135,        // ขอบซ้าย/ขวาของพื้นที่ใช้งานจริง
} as const;

export default { palette, surface, font, size, space, radius, encounterFrame };

export const paper = { bg: '#ddc89a', light: '#eddfba', ink: '#302319', muted: '#68523a', red: '#8a3025', line: '#9e8052' };

export const paperPalette = {
 ink:paper.ink,inkSoft:'#4a3826',umber:paper.bg,olive:'#736342',
 paperDeep:'#b89459',paper:'#cfb483',paperLight:paper.light,moon:paper.ink,moonDim:paper.muted,
 blood:paper.red,bloodDeep:'#62261e',bloodLit:paper.red,text:paper.ink,textDim:paper.muted,textFaint:'#786047',
 line:'#b0976e',lineStrong:'#7b5c35',scrim:paper.bg,scrimHeavy:paper.bg,scrimFull:paper.bg,shadow:'transparent'
} as const;
export const paperSurface={panel:paper.light,panelRaise:'#efdfb4',panelSunk:'#d4be91',panelDim:'#d1be9c',panelWell:'#cfb889',panelDeep:'#cbb280',panelActive:'#e7c88d',glass:'#c5ae82',glassDim:'#d1bc96'} as const;

export const pulpColors = {'selectedPaper': '#f2dba5', 'healthTrack': '#b8a17b', 'routeCurrent': '#e6b963', 'primaryPaper': '#e8c77b', 'pressedPaper': '#c1a675', 'expTrack': '#b7a17b', 'expFill': '#705231', 'sceneInk': '#14100a', 'switchOff': '#998566', 'switchOn': '#7b4b28', 'lanternGlow': '#bc793c', 'enemyBack': '#453126', 'enemyInk': '#bda16d', 'bone': '#e8dcc0', 'black': '#000', 'paperEdge': '#917448', 'paperSpeck': '#725436', 'paperWear': '#886a3d', 'storySceneShade': 'rgba(12,9,5,.2)', 'storyTextShade': 'rgba(12,9,5,.78)', 'loadingShade': 'rgba(12,9,5,.25)', 'mapShade': 'rgba(12,9,5,.32)', 'settingsShade': 'rgba(12,9,5,.95)', 'menuShade': 'rgba(12,9,5,.15)', 'eventTextShade': 'rgba(12,9,5,.76)'} as const;

/** Pigments sampled from the ritual UI raster artwork. */
export const combatUiColors={statusDebuff:'#5c211c',statusBuff:'#302b1b',rewardShade:'rgba(12,9,5,.38)'} as const;

export const ritualColors={chalk:"#f2e7ca",circle:"#b45139",current:"#d78161",label:"#edac8a",chalkWash:"rgba(242,231,202,.08)",shadow:"#110c07"} as const;

/** Clean ivory text fields and coarse comic ink for character selection. */
export const notebookColors = { paper: '#fff7e5', ink: '#171410', red: '#751c28', disabled: '#514c43' } as const;

/** Pigments and shades for the illustrated occupation table. */
export const occupationColors = {"night": "#100d09", "cream": "#f4dfb7", "subtitleShade": "#17110bd9", "backShade": "#261b12e8", "backEdge": "#a37c4c", "backInk": "#f2dfb7", "pressWash": "#ffe5a533", "pressEdge": "#efc979", "labelInk": "#21180f", "hintShade": "#17110be6", "scrim": "#080603e8", "detailEdge": "#6b452b", "mutedInk": "#674331", "rule": "#bc9b72"} as const;

export const badgeColors={neutral:"#4b4432",negative:"#682c2b",positive:"#304d37",neutralLine:"#a59972",negativeLine:"#bc6660",positiveLine:"#79a37c",ink:"#f1e5c9",counter:"#24231c",disabledInk:"#454545"} as const;

export const quietUiColors={hudShade:'rgba(17,17,13,.82)',optionLine:'rgba(225,207,153,.2)',eventPanel:'rgba(18,15,10,.92)',defeatShade:'rgba(12,9,5,.55)'};

export const blessingSealColors={paperInk:paper.ink,backing:palette.inkSoft,line:palette.moonDim,completed:badgeColors.positiveLine};

/** Pigments for the user's approved archive notebook layout. */
export const archiveColors={scene:'rgba(12,16,12,.90)',scrim:'rgba(0,0,0,.82)',field:'#25271e',fieldEdge:'#79694b',rule:'#665439',muted:'#6b624e',panel:'#1c2119',edge:'#8b744b',silhouette:'#4b4940'} as const;
