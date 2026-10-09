// ============================================================
// 马来语轻打卡（1-Min Daily Malay）—— 90 天场景化进阶体系
// Day 1-30  基础日常（Mamak档/打招呼/数字/时间/饮食）
// Day 31-60 商务沟通（议价/会议/邮件/电话/合同）
// Day 61-90 深度场景（工厂/合规/文化融入/危机处理）
// 每日：主题 + 5 词汇 + 1 金句 + 1 避坑指南
// ============================================================

export interface MalayWord {
  malay: string;
  pronunciation: string;  // 发音近似标注（汉语拼音风格）
  chinese: string;
  english: string;
}

export interface DailyLesson {
  day: number;
  theme: string;          // 主题，如 [ Mamak 档破冰 ]
  words: MalayWord[];     // 5 个核心词汇
  sentence: {
    malay: string;
    chinese: string;
    scenario: string;     // 应用场景
  };
  tip: string;            // 本土文化/商务避坑指南
}

export const MALAY_LESSONS: DailyLesson[] = [
  // ========== Day 1-10 基础打招呼与数字 ==========
  {
    day: 1,
    theme: "[ Mamak 档破冰 ]",
    words: [
      { malay: "Apa khabar", pronunciation: "阿爸 卡巴", chinese: "你好", english: "How are you" },
      { malay: "Khabar baik", pronunciation: "卡巴 拜克", chinese: "我很好", english: "I'm fine" },
      { malay: "Teh tarik", pronunciation: "德 大里克", chinese: "拉茶", english: "Pulled tea" },
      { malay: "Roti canai", pronunciation: "罗蒂 差奈", chinese: "印度煎饼", english: "Flatbread" },
      { malay: "Tumpang lalu", pronunciation: "东邦 拉鲁", chinese: "借过", english: "Excuse me" },
    ],
    sentence: { malay: "Satu teh tarik, satu roti canai.", chinese: "一杯拉茶，一份煎饼。", scenario: "在 Mamak 档点餐时使用" },
    tip: "在 Mamak 档用马来语点单会立刻拉近与店家的距离，拉茶一定要点 Teh Tarik。",
  },
  {
    day: 2,
    theme: "[ 初次见面问候 ]",
    words: [
      { malay: "Nama saya", pronunciation: "那马 沙亚", chinese: "我的名字是", english: "My name is" },
      { malay: "Saya orang Cina", pronunciation: "沙亚 奥郎 支那", chinese: "我是华人", english: "I am Chinese" },
      { malay: "Dari China", pronunciation: "达里 支那", chinese: "来自中国", english: "From China" },
      { malay: "Senang berjumpa", pronunciation: "色南 伯宗帕", chinese: "很高兴遇见你", english: "Nice to meet you" },
      { malay: "Selamat datang", pronunciation: "色拉马特 达当", chinese: "欢迎", english: "Welcome" },
    ],
    sentence: { malay: "Nama saya Chen, saya dari China.", chinese: "我叫陈，来自中国。", scenario: "商务初次见面自我介绍" },
    tip: "马来人见面习惯握手，男性与穆斯林女性握手前需观察对方是否主动伸手，避免冒犯。",
  },
  {
    day: 3,
    theme: "[ 数字与价格 ]",
    words: [
      { malay: "Satu", pronunciation: "沙杜", chinese: "一", english: "One" },
      { malay: "Dua", pronunciation: "杜瓦", chinese: "二", english: "Two" },
      { malay: "Tiga", pronunciation: "迪加", chinese: "三", english: "Three" },
      { malay: "Sepuluh", pronunciation: "色布鲁", chinese: "十", english: "Ten" },
      { malay: "Berapa", pronunciation: "伯拉巴", chinese: "多少", english: "How much" },
    ],
    sentence: { malay: "Ini berapa ringgit?", chinese: "这个多少令吉？", scenario: "市场或商店问价" },
    tip: "马来西亚货币叫令吉（Ringgit），说 Ringgit 比说 Ringgit Malaysia 更地道，马来数字要多练。",
  },
  {
    day: 4,
    theme: "[ 时间与约会 ]",
    words: [
      { malay: "Pukul berapa", pronunciation: "普库 伯拉巴", chinese: "几点", english: "What time" },
      { malay: "Pukul lapan", pronunciation: "普库 拉班", chinese: "八点", english: "Eight o'clock" },
      { malay: "Esok", pronunciation: "诶索", chinese: "明天", english: "Tomorrow" },
      { malay: "Hari ini", pronunciation: "哈利 伊尼", chinese: "今天", english: "Today" },
      { malay: "Janji temu", pronunciation: "张吉 登木", chinese: "约会/会面", english: "Appointment" },
    ],
    sentence: { malay: "Kita jumpa esok pukul lapan.", chinese: "我们明天八点见。", scenario: "约定见面时间" },
    tip: "马来人时间观念较宽松，'fashionably late'（时尚迟到）15 分钟内属正常，但商务场合建议准时。",
  },
  {
    day: 5,
    theme: "[ 饮食文化 ]",
    words: [
      { malay: "Nasi lemak", pronunciation: "那西 勒马", chinese: "椰浆饭", english: "Coconut rice" },
      { malay: "Kuah", pronunciation: "夸", chinese: "汤汁/酱料", english: "Gravy" },
      { malay: "Pedas", pronunciation: "伯达斯", chinese: "辣", english: "Spicy" },
      { malay: "Manis", pronunciation: "马尼斯", chinese: "甜", english: "Sweet" },
      { malay: "Halal", pronunciation: "哈拉", chinese: "清真", english: "Halal" },
    ],
    sentence: { malay: "Saya tidak makan daging babi, halal saja.", chinese: "我不吃猪肉，只要清真的。", scenario: "点餐时说明饮食禁忌" },
    tip: "穆斯林朋友不食猪肉，共同用餐选择 Halal 餐厅是基本尊重，Nasi Lemak 是国饭必尝。",
  },
  {
    day: 6,
    theme: "[ 交通出行 ]",
    words: [
      { malay: "Lebuhraya", pronunciation: "勒布拉亚", chinese: "高速公路", english: "Highway" },
      { malay: "Teksi", pronunciation: "特克西", chinese: "出租车", english: "Taxi" },
      { malay: "Ke mana", pronunciation: "柯 马纳", chinese: "去哪里", english: "Where to" },
      { malay: "Jalan", pronunciation: "扎兰", chinese: "路/走", english: "Road" },
      { malay: "Berasas", pronunciation: "伯拉萨", chinese: "出发", english: "Depart" },
    ],
    sentence: { malay: "Teksi, ke KLCC, boleh?", chinese: "出租车，去 KLCC，可以吗？", scenario: "打车时告知目的地" },
    tip: "Grab 是大马主流打车软件，比出租车便宜且可定位，建议全程使用 Grab，别坐机场黑车。",
  },
  {
    day: 7,
    theme: "[ 购物与讨价 ]",
    words: [
      { malay: "Mahal", pronunciation: "马哈", chinese: "贵", english: "Expensive" },
      { malay: "Murah", pronunciation: "木拉", chinese: "便宜", english: "Cheap" },
      { malay: "Boleh kurang", pronunciation: "波莱 古兰", chinese: "可以少点吗", english: "Can reduce" },
      { malay: "Diskaun", pronunciation: "迪斯考", chinese: "折扣", english: "Discount" },
      { malay: "Belum", pronunciation: "伯伦", chinese: "还没", english: "Not yet" },
    ],
    sentence: { malay: "Mahal sangat, boleh diskaun sikit?", chinese: "太贵了，可以打折吗？", scenario: "市场或小店议价" },
    tip: "马来市集（Pasar Malam 夜市）可以讨价，但商场明码标价不议价，态度友善是关键。",
  },
  {
    day: 8,
    theme: "[ 礼貌用语 ]",
    words: [
      { malay: "Terima kasih", pronunciation: "特里马 卡西", chinese: "谢谢", english: "Thank you" },
      { malay: "Sama-sama", pronunciation: "沙马-沙马", chinese: "不客气", english: "You're welcome" },
      { malay: "Maaf", pronunciation: "马阿夫", chinese: "对不起", english: "Sorry" },
      { malay: "Tolong", pronunciation: "托龙", chinese: "请/帮忙", english: "Please/help" },
      { malay: "Boleh", pronunciation: "波莱", chinese: "可以", english: "Can/OK" },
    ],
    sentence: { malay: "Tolong bantu saya, terima kasih.", chinese: "请帮帮我，谢谢。", scenario: "请求帮助" },
    tip: "Tolong（托龙）是万用礼貌词，几乎所有请求前加 Tolong 都显得客气，Boleh 表示'可以'。",
  },
  {
    day: 9,
    theme: "[ 家人称谓 ]",
    words: [
      { malay: "Keluarga", pronunciation: "克鲁阿加", chinese: "家人", english: "Family" },
      { malay: "Ayah", pronunciation: "阿亚", chinese: "父亲", english: "Father" },
      { malay: "Ibu", pronunciation: "伊布", chinese: "母亲", english: "Mother" },
      { malay: "Abang", pronunciation: "阿邦", chinese: "哥哥", english: "Elder brother" },
      { malay: "Kakak", pronunciation: "卡卡", chinese: "姐姐", english: "Elder sister" },
    ],
    sentence: { malay: "Saya ada abang dan kakak.", chinese: "我有一个哥哥和姐姐。", scenario: "聊及家庭" },
    tip: "用 Abang/Kakak（哥/姐）称呼年长的陌生马来男性/女性是亲近且尊重的表现，比 Encik/Puan 更亲切。",
  },
  {
    day: 10,
    theme: "[ 天气与日常 ]",
    words: [
      { malay: "Cuaca", pronunciation: "楚瓦查", chinese: "天气", english: "Weather" },
      { malay: "Panas", pronunciation: "帕纳斯", chinese: "热", english: "Hot" },
      { malay: "Hujan", pronunciation: "乌占", chinese: "雨", english: "Rain" },
      { malay: "Mendung", pronunciation: "门东", chinese: "阴天", english: "Cloudy" },
      { malay: "Tandas", pronunciation: "坦达斯", chinese: "洗手间", english: "Toilet" },
    ],
    sentence: { malay: "Cuaca di KL panas sekali hari ini.", chinese: "今天吉隆坡天气很热。", scenario: "寒暄聊天气" },
    tip: "吉隆坡常年 28-33℃，午后常有雷阵雨（Hujan petang），出门带伞，室内冷气极冷需备薄外套。",
  },

  // ========== Day 11-20 生活场景 ==========
  {
    day: 11,
    theme: "[ 手机与网络 ]",
    words: [
      { malay: "Telefon", pronunciation: "特莱冯", chinese: "电话", english: "Phone" },
      { malay: "Internet", pronunciation: "因特网", chinese: "网络", english: "Internet" },
      { malay: "Kadar data", pronunciation: "卡达 达塔", chinese: "流量套餐", english: "Data plan" },
      { malay: "Wifi", pronunciation: "歪发", chinese: "WiFi", english: "WiFi" },
      { malay: "Rangkaian", pronunciation: "兰盖安", chinese: "信号/网络", english: "Network" },
    ],
    sentence: { malay: "Ada wifi? Password apa?", chinese: "有 WiFi 吗？密码是什么？", scenario: "咖啡馆/酒店问 WiFi" },
    tip: "大马预付费卡推荐 Maxis/Hotlink 或 Digi，机场即可购买，流量便宜，漫游别开。",
  },
  {
    day: 12,
    theme: "[ 银行与转账 ]",
    words: [
      { malay: "Bank", pronunciation: "邦", chinese: "银行", english: "Bank" },
      { malay: "Duit", pronunciation: "杜伊", chinese: "钱", english: "Money" },
      { malay: "Pindah wang", pronunciation: "频达 旺", chinese: "转账", english: "Transfer money" },
      { malay: "Kad", pronunciation: "卡德", chinese: "卡", english: "Card" },
      { malay: "Nombor akaun", pronunciation: "农博 阿康", chinese: "账号", english: "Account number" },
    ],
    sentence: { malay: "Saya nak pindah wang ke akaun ini.", chinese: "我要转账到这个账号。", scenario: "银行柜台或 App 转账" },
    tip: "马来本地转账用 DuitNow（手机号即账号）极方便，国际汇款用 Wise 比银行省 3-5 倍手续费。",
  },
  {
    day: 13,
    theme: "[ 医疗健康 ]",
    words: [
      { malay: "Sakit", pronunciation: "沙基特", chinese: "疼/生病", english: "Sick/pain" },
      { malay: "Hospital", pronunciation: "侯斯皮塔", chinese: "医院", english: "Hospital" },
      { malay: "Ubat", pronunciation: "乌巴特", chinese: "药", english: "Medicine" },
      { malay: "Doktor", pronunciation: "多克托", chinese: "医生", english: "Doctor" },
      { malay: "Demam", pronunciation: "德马姆", chinese: "发烧", english: "Fever" },
    ],
    sentence: { malay: "Saya demam, nak jumpa doktor.", chinese: "我发烧了，要看医生。", scenario: "就医说明症状" },
    tip: "大马私立医院（Gleneagles/Pantai）中文医生多且服务好，公立便宜但需排队，紧急拨 999。",
  },
  {
    day: 14,
    theme: "[ 酒店入住 ]",
    words: [
      { malay: "Tempah", pronunciation: "邓巴", chinese: "预订", english: "Book" },
      { malay: "Bilik", pronunciation: "比利", chinese: "房间", english: "Room" },
      { malay: "Kunci", pronunciation: "坤齐", chinese: "钥匙", english: "Key" },
      { malay: "Check in", pronunciation: "切金", chinese: "入住", english: "Check in" },
      { malay: "Sarapan", pronunciation: "萨拉班", chinese: "早餐", english: "Breakfast" },
    ],
    sentence: { malay: "Saya tempah bilik, nama Chen.", chinese: "我预订了房间，名字是陈。", scenario: "酒店前台入住" },
    tip: "马来酒店多不含早餐（Sarapan），预订时看清楚，部分酒店需付旅游税（Tourism Tax）每晚 10 令吉。",
  },
  {
    day: 15,
    theme: "[ 问路指引 ]",
    words: [
      { malay: "Ke mana", pronunciation: "柯 马纳", chinese: "去哪", english: "Where" },
      { malay: "Kiri", pronunciation: "基里", chinese: "左", english: "Left" },
      { malay: "Kanan", pronunciation: "卡南", chinese: "右", english: "Right" },
      { malay: "Terus", pronunciation: "德鲁斯", chinese: "直走", english: "Straight" },
      { malay: "Berhampiran", pronunciation: "伯汉皮兰", chinese: "附近", english: "Nearby" },
    ],
    sentence: { malay: "Jalan terus, kemudian kiri.", chinese: "直走，然后左转。", scenario: "问路或导航" },
    tip: "Waze 是大马人最爱的导航 App，比 Google Maps 更准，能避开封路和交警，强烈推荐安装。",
  },
  {
    day: 16,
    theme: "[ 朋友聚会 ]",
    words: [
      { malay: "Kawan", pronunciation: "卡万", chinese: "朋友", english: "Friend" },
      { malay: "Jom", pronunciation: "宗", chinese: "走吧", english: "Let's go" },
      { malay: "Santai", pronunciation: "三泰", chinese: "放松", english: "Relax" },
      { malay: "Tumpang tanya", pronunciation: "东邦 塔尼亚", chinese: "借问一下", english: "May I ask" },
      { malay: "Jumpa lagi", pronunciation: "宗帕 拉吉", chinese: "再见", english: "See you again" },
    ],
    sentence: { malay: "Jom, kita minum teh bersama.", chinese: "走，我们一起喝茶去。", scenario: "邀约朋友喝茶" },
    tip: "Jom（宗）是万用召唤词，Jom makan（去吃）、Jom minum（去喝），年轻人几乎句句带 Jom。",
  },
  {
    day: 17,
    theme: "[ 工作日常 ]",
    words: [
      { malay: "Kerja", pronunciation: "柯加", chinese: "工作", english: "Work" },
      { malay: "Mesyuarat", pronunciation: "梅叔亚特", chinese: "会议", english: "Meeting" },
      { malay: "Selesai", pronunciation: "色莱赛", chinese: "完成", english: "Done" },
      { malay: "Laporan", pronunciation: "拉波兰", chinese: "报告", english: "Report" },
      { malay: "Tarikh akhir", pronunciation: "达利 阿齐", chinese: "截止日期", english: "Deadline" },
    ],
    sentence: { malay: "Laporan ini siap sebelum tarikh akhir.", chinese: "这份报告在截止日期前完成。", scenario: "工作汇报" },
    tip: "大马职场节奏相对慢，Mesyuarat 前先发邮件确认，催进度用 gentle reminder 而非直接催促。",
  },
  {
    day: 18,
    theme: "[ 情绪表达 ]",
    words: [
      { malay: "Gembira", pronunciation: "甘比拉", chinese: "开心", english: "Happy" },
      { malay: "Pening", pronunciation: "彭宁", chinese: "头疼/晕", english: "Dizzy" },
      { malay: "Sedih", pronunciation: "色迪", chinese: "难过", english: "Sad" },
      { malay: "Penat", pronunciation: "彭纳", chinese: "累", english: "Tired" },
      { malay: "Bosan", pronunciation: "博桑", chinese: "无聊", english: "Bored" },
    ],
    sentence: { malay: "Saya penat hari ini.", chinese: "我今天很累。", scenario: "表达疲惫" },
    tip: "马来人感情表达较含蓄，直接说 Penat/Bosan 可拉近距离，但不要在商务场合抱怨太多。",
  },
  {
    day: 19,
    theme: "[ 颜色描述 ]",
    words: [
      { malay: "Merah", pronunciation: "梅拉", chinese: "红", english: "Red" },
      { malay: "Biru", pronunciation: "比鲁", chinese: "蓝", english: "Blue" },
      { malay: "Hijau", pronunciation: "希交", chinese: "绿", english: "Green" },
      { malay: "Kuning", pronunciation: "库宁", chinese: "黄", english: "Yellow" },
      { malay: "Hitam", pronunciation: "希坦", chinese: "黑", english: "Black" },
    ],
    sentence: { malay: "Saya suka warna biru.", chinese: "我喜欢蓝色。", scenario: "描述喜好或选商品颜色" },
    tip: "马来文化中绿色（Hijau）与伊斯兰相关，黄色（Kuning）曾是王室专属色，避免随意使用黄色主题。",
  },
  {
    day: 20,
    theme: "[ 星期与日期 ]",
    words: [
      { malay: "Isnin", pronunciation: "伊斯宁", chinese: "星期一", english: "Monday" },
      { malay: "Jumaat", pronunciation: "朱马", chinese: "星期五", english: "Friday" },
      { malay: "Sabtu", pronunciation: "沙布杜", chinese: "星期六", english: "Saturday" },
      { malay: "Ahad", pronunciation: "阿哈", chinese: "星期日", english: "Sunday" },
      { malay: "Minggu", pronunciation: "明古", chinese: "周/星期", english: "Week" },
    ],
    sentence: { malay: "Jumaat kita ada mesyuarat.", chinese: "星期五我们有会议。", scenario: "安排会议时间" },
    tip: "马来世界周一为一周开始（Isnin），周五（Jumaat）是穆斯林主麻日，中午祈祷时间避免安排会议。",
  },

  // ========== Day 21-30 饮食与社交进阶 ==========
  {
    day: 21,
    theme: "[ 点餐进阶 ]",
    words: [
      { malay: "Banyak", pronunciation: "班雅", chinese: "多", english: "Many/much" },
      { malay: "Sedikit", pronunciation: "色迪基", chinese: "少一点", english: "A little" },
      { malay: "Tanpa", pronunciation: "弹巴", chinese: "不要/不加", english: "Without" },
      { malay: "Sos", pronunciation: "索斯", chinese: "酱汁", english: "Sauce" },
      { malay: "Sejuk", pronunciation: "色祖克", chinese: "冷的", english: "Cold" },
    ],
    sentence: { malay: "Teh tarik sejuk, tanpa gula.", chinese: "冰拉茶，不加糖。", scenario: "点餐时指定口味" },
    tip: "马来饮食偏甜，点 Teh Tarik 可加 kurang manis（少糖），冰饮叫 Sejuk，热饮叫 Panas。",
  },
  {
    day: 22,
    theme: "[ 美食词汇 ]",
    words: [
      { malay: "Satay", pronunciation: "沙爹", chinese: "沙爹", english: "Satay" },
      { malay: "Laksa", pronunciation: "叻沙", chinese: "叻沙", english: "Laksa" },
      { malay: "Char kway teow", pronunciation: "炒粿条", chinese: "炒粿条", english: "Char kway teow" },
      { malay: "Mee goreng", pronunciation: "面 果林", chinese: "炒面", english: "Fried noodles" },
      { malay: "Cendol", pronunciation: "煎多", chinese: "珍多冰", english: "Cendol" },
    ],
    sentence: { malay: "Saya nak mee goreng dan cendol.", chinese: "我要炒面和珍多冰。", scenario: "美食档口点单" },
    tip: "大马是美食天堂，Jalan Alor（阿罗街）是夜市天堂，椰浆饭、沙爹、叻沙、肉骨茶必试。",
  },
  {
    day: 23,
    theme: "[ 商务午餐 ]",
    words: [
      { malay: "Jemput", pronunciation: "詹姆", chinese: "邀请", english: "Invite" },
      { malay: "Belanja", pronunciation: "伯兰加", chinese: "请客", english: "Treat" },
      { malay: "Kira", pronunciation: "基拉", chinese: "结账", english: "Bill" },
      { malay: "Bahagian", pronunciation: "巴合安", chinese: "分摊", english: "Share" },
      { malay: "Minum", pronunciation: "明um", chinese: "喝", english: "Drink" },
    ],
    sentence: { malay: "Saya belanja kali ini.", chinese: "这次我请客。", scenario: "商务聚餐结账" },
    tip: "马来人聚餐常轮流请客（Belanja），AA 制叫 Bahagian sama，商务餐通常由东道主或年长者结账。",
  },
  {
    day: 24,
    theme: "[ 赞美与感谢 ]",
    words: [
      { malay: "Bagus", pronunciation: "巴古斯", chinese: "好", english: "Good" },
      { malay: "Cantik", pronunciation: "灿蒂", chinese: "漂亮", english: "Beautiful" },
      { malay: "Pandai", pronunciation: "班戴", chinese: "聪明", english: "Smart" },
      { malay: "Sedap", pronunciation: "色达", chinese: "好吃", english: "Delicious" },
      { malay: "HeBAT", pronunciation: "赫巴特", chinese: "厉害", english: "Great" },
    ],
    sentence: { malay: "Makanan ini sedap sangat!", chinese: "这食物太好吃了！", scenario: "赞美食物或服务" },
    tip: "马来人喜欢被赞美，说 Bagus/Sedap/Cantik 能快速拉近距离，赞美后接 Terima kasih 是标准回应。",
  },
  {
    day: 25,
    theme: "[ 购物清单 ]",
    words: [
      { malay: "Beli", pronunciation: "贝利", chinese: "买", english: "Buy" },
      { malay: "Pasar", pronunciation: "巴萨", chinese: "市场", english: "Market" },
      { malay: "Kedai", pronunciation: "柯戴", chinese: "店", english: "Shop" },
      { malay: "Stok", pronunciation: "斯托", chinese: "库存", english: "Stock" },
      { malay: "Promosi", pronunciation: "普罗莫西", chinese: "促销", english: "Promotion" },
    ],
    sentence: { malay: "Kedai ini ada promosi hebat.", chinese: "这家店有很棒的促销。", scenario: "购物时讨论促销" },
    tip: "大马购物季：1月/3月/5月/8月/12月有大促销（马来西亚购物节），Suria KLCC/Pavilion 是主流商场。",
  },
  {
    day: 26,
    theme: "[ 家庭拜访 ]",
    words: [
      { malay: "Rumah", pronunciation: "鲁马", chinese: "家", english: "House" },
      { malay: "Tamu", pronunciation: "塔木", chinese: "客人", english: "Guest" },
      { malay: "Hadiah", pronunciation: "哈迪亚", chinese: "礼物", english: "Gift" },
      { malay: "Kasut", pronunciation: "卡苏", chinese: "鞋子", english: "Shoes" },
      { malay: "Duduk", pronunciation: "杜杜", chinese: "坐", english: "Sit" },
    ],
    sentence: { malay: "Boleh masuk rumah? Saya bawa hadiah.", chinese: "可以进屋吗？我带了礼物。", scenario: "拜访马来家庭" },
    tip: "进马来家庭必须脱鞋（Kasut），带小礼物（Hadiah）如点心或水果是礼貌，右手接物递物。",
  },
  {
    day: 27,
    theme: "[ 节庆问候 ]",
    words: [
      { malay: "Selamat Hari Raya", pronunciation: "色拉马特 哈利 拉亚", chinese: "开斋节快乐", english: "Eid Mubarak" },
      { malay: "Aidilfitri", pronunciation: "艾迪菲特里", chinese: "开斋节", english: "Eid al-Fitr" },
      { malay: "Kuih", pronunciation: "桂", chinese: "马来糕点", english: "Malay kueh" },
      { malay: "Duit raya", pronunciation: "杜伊 拉亚", chinese: "开斋节红包", english: "Green packet" },
      { malay: "Salam", pronunciation: "萨拉姆", chinese: "问候礼", english: "Greeting" },
    ],
    sentence: { malay: "Selamat Hari Raya Aidilfitri!", chinese: "开斋节快乐！", scenario: "开斋节问候" },
    tip: "开斋节（Hari Raya）是马来最大节日，穿绿色或浅色衣服拜访，双手合十 Salam，长辈会给 Duit Raya。",
  },
  {
    day: 28,
    theme: "[ 电话沟通 ]",
    words: [
      { malay: "Saya cakap", pronunciation: "沙亚 查卡", chinese: "我说", english: "I speak" },
      { malay: "Boleh ulang", pronunciation: "波莱 乌兰", chinese: "可以重复", english: "Can repeat" },
      { malay: "Tunggu", pronunciation: "通古", chinese: "等", english: "Wait" },
      { malay: "Putus", pronunciation: "普杜斯", chinese: "挂断", english: "Hang up" },
      { malay: "Pesan", pronunciation: "佩桑", chinese: "留言/订购", english: "Message/order" },
    ],
    sentence: { malay: "Maaf, boleh ulang sekali?", chinese: "对不起，可以重复一次吗？", scenario: "电话中没听清" },
    tip: "马来人电话开头常说 Helo（哈喽），正式场合报 Nama saya（我是...），挂断前说 Jumpa lagi（再见）。",
  },
  {
    day: 29,
    theme: "[ 邮件书写 ]",
    words: [
      { malay: "Tuan/Puan", pronunciation: "端/普安", chinese: "先生/女士", english: "Mr/Mrs" },
      { malay: "Sukacita memaklumkan", pronunciation: "苏基达 马库姆兰", chinese: "很高兴通知", english: "Glad to inform" },
      { malay: "Lampiran", pronunciation: "兰比兰", chinese: "附件", english: "Attachment" },
      { malay: "Tindakan", pronunciation: "丁达安", chinese: "行动/回复", english: "Action" },
      { malay: "Sekian", pronunciation: "色基安", chinese: "到此为止", english: "That's all" },
    ],
    sentence: { malay: "Sukacita memaklumkan, lampiran adalah laporan.", chinese: "很高兴通知，附件是报告。", scenario: "商务邮件开头" },
    tip: "正式马来邮件用 Tuan/Puan + 姓氏，结尾用 Salam hormat（敬礼），避免用太口语的 Jom/Boleh。",
  },
  {
    day: 30,
    theme: "[ 日常生活复盘 ]",
    words: [
      { malay: "Hari ini", pronunciation: "哈利 伊尼", chinese: "今天", english: "Today" },
      { malay: "Selesa", pronunciation: "色莱萨", chinese: "舒服", english: "Comfortable" },
      { malay: "Cukup", pronunciation: "祖库", chinese: "足够", english: "Enough" },
      { malay: "Pergi", pronunciation: "佩吉", chinese: "去", english: "Go" },
      { malay: "Balik", pronunciation: "巴利", chinese: "回", english: "Return" },
    ],
    sentence: { malay: "Saya balik kerja sekarang.", chinese: "我现在下班回家了。", scenario: "下班道别" },
    tip: "Balik 既指回家也指回国，Balik kampung 是回乡下（马来人长假口头禅），日常用 Balik kerja 下班。",
  },
];

// 扩展到 90 天：基于前 30 天的主题模板，生成 Day 31-90
// Day 31-60 商务沟通、Day 61-90 深度场景
const BUSINESS_THEMES: { theme: string; words: MalayWord[]; sentence: { malay: string; chinese: string; scenario: string }; tip: string }[] = [
  {
    theme: "[ 商务议价 ]",
    words: [
      { malay: "Harga", pronunciation: "哈嘎", chinese: "价格", english: "Price" },
      { malay: "Tawar", pronunciation: "塔瓦", chinese: "还价", english: "Bargain" },
      { malay: "Kos", pronunciation: "戈斯", chinese: "成本", english: "Cost" },
      { malay: "Untung", pronunciation: "恩顿", chinese: "利润", english: "Profit" },
      { malay: "Patut", pronunciation: "巴杜", chinese: "合理", english: "Fair" },
    ],
    sentence: { malay: "Harga ini tinggi, boleh tawar lagi?", chinese: "这价格高了，可以再让点吗？", scenario: "商务议价" },
    tip: "马来商务议价要给对方面子，用 patut（合理）而非 mahal（贵），先建立关系再谈价格。",
  },
  {
    theme: "[ 会议开场 ]",
    words: [
      { malay: "Mulakan", pronunciation: "木拉坎", chinese: "开始", english: "Start" },
      { malay: "Agenda", pronunciation: "阿干达", chinese: "议程", english: "Agenda" },
      { malay: "Perbincangan", pronunciation: "尔本钱甘", chinese: "讨论", english: "Discussion" },
      { malay: "Keputusan", pronunciation: "哥布图桑", chinese: "决定", english: "Decision" },
      { malay: "Masa", pronunciation: "马萨", chinese: "时间", english: "Time" },
    ],
    sentence: { malay: "Kita mulakan mesyuarat dengan agenda hari ini.", chinese: "我们以今日议程开始会议。", scenario: "会议开场" },
    tip: "马来会议常先寒暄（Basuh mata）再进入正题，开场致谢与祷告是礼貌，会议纪要会后立即发。",
  },
  {
    theme: "[ 合同条款 ]",
    words: [
      { malay: "Kontrak", pronunciation: "控特拉", chinese: "合同", english: "Contract" },
      { malay: "Terma", pronunciation: "特马", chinese: "条款", english: "Terms" },
      { malay: "Tempoh", pronunciation: "邓博", chinese: "期限", english: "Period" },
      { malay: "Tandatangan", pronunciation: "丹达达南", chinese: "签名", english: "Signature" },
      { malay: "Sah", pronunciation: "萨", chinese: "有效", english: "Valid" },
    ],
    sentence: { malay: "Sila semak terma kontrak sebelum tandatangan.", chinese: "请在签名前核对合同条款。", scenario: "签署合同前" },
    tip: "马来合同受 1950 年合同法保护，英文版本通常优先，建议双语对照，争议选吉隆坡仲裁。",
  },
  {
    theme: "[ 邮件催办 ]",
    words: [
      { malay: "Tindakan susulan", pronunciation: "丁达安 苏苏兰", chinese: "跟进", english: "Follow-up" },
      { malay: "Segera", pronunciation: "色格拉", chinese: "尽快", english: "As soon as possible" },
      { malay: "Respons", pronunciation: "勒斯邦斯", chinese: "回复", english: "Response" },
      { malay: "Lampiran", pronunciation: "兰比兰", chinese: "附件", english: "Attachment" },
      { malay: "Maklum balas", pronunciation: "马库姆 巴拉斯", chinese: "反馈", english: "Feedback" },
    ],
    sentence: { malay: "Boleh beri maklum balas segera?", chinese: "可以尽快给反馈吗？", scenario: "邮件催办" },
    tip: "催办用 gentle reminder（Pengingat lembut），马来人吃软不吃硬，态度友善比直接催更有效。",
  },
  {
    theme: "[ 电话会议 ]",
    words: [
      { malay: "Panggilan", pronunciation: "庞加兰", chinese: "电话", english: "Call" },
      { malay: "Mikrofon", pronunciation: "米克罗丰", chinese: "麦克风", english: "Microphone" },
      { malay: "Bunyi", pronunciation: "布尼", chinese: "声音", english: "Sound" },
      { malay: "Tidak jelas", pronunciation: "迪达克 贾拉斯", chinese: "不清晰", english: "Not clear" },
      { malay: "Sambung semula", pronunciation: "萨姆邦 色木拉", chinese: "重新连接", english: "Reconnect" },
    ],
    sentence: { malay: "Bunyi tidak jelas, boleh sambung semula?", chinese: "声音不清晰，可以重连吗？", scenario: "线上会议网络问题" },
    tip: "马来公司多用 Google Meet/Zoom，提前发链接，网络差时说 Sambung semula，避免直接挂断。",
  },
  {
    theme: "[ 产品介绍 ]",
    words: [
      { malay: "Produk", pronunciation: "普罗杜克", chinese: "产品", english: "Product" },
      { malay: "Ciri", pronunciation: "吉里", chinese: "特色", english: "Feature" },
      { malay: "Kualiti", pronunciation: "库瓦利蒂", chinese: "质量", english: "Quality" },
      { malay: "Jaminan", pronunciation: "贾米南", chinese: "保证", english: "Warranty" },
      { malay: "Contoh", pronunciation: "琼托", chinese: "样品", english: "Sample" },
    ],
    sentence: { malay: "Produk ini ada jaminan setahun.", chinese: "这款产品有一年质保。", scenario: "产品介绍" },
    tip: "介绍产品用 Ciri-ciri（特色）和 Kualiti（质量）打动客户，提供 Contoh（样品）试用是有效策略。",
  },
  {
    theme: "[ 市场调研 ]",
    words: [
      { malay: "Pasaran", pronunciation: "巴萨兰", chinese: "市场", english: "Market" },
      { malay: "Kajian", pronunciation: "卡吉安", chinese: "调研", english: "Research" },
      { malay: "Pengguna", pronunciation: "彭古纳", chinese: "用户", english: "User" },
      { malay: "Permintaan", pronunciation: "庞明坦", chinese: "需求", english: "Demand" },
      { malay: "Pesaing", pronunciation: "佩赛英", chinese: "竞争对手", english: "Competitor" },
    ],
    sentence: { malay: "Kita kaji permintaan pasaran dulu.", chinese: "我们先调研市场需求。", scenario: "市场进入决策" },
    tip: "大马市场调研用 Google Trends + Instagram，年轻用户在 TikTok，商务人群在 LinkedIn，本地论坛 Lowyat。",
  },
  {
    theme: "[ 商务晚餐 ]",
    words: [
      { malay: "Makan malam", pronunciation: "马干 马兰", chinese: "晚餐", english: "Dinner" },
      { malay: "Minum-minum", pronunciation: "明um-明um", chinese: "喝一杯", english: "Drinks" },
      { malay: "Alkohol", pronunciation: "阿尔科霍", chinese: "酒精", english: "Alcohol" },
      { malay: "Jus", pronunciation: "朱斯", chinese: "果汁", english: "Juice" },
      { malay: "Tidak halal", pronunciation: "迪达克 哈拉", chinese: "不清真", english: "Not halal" },
    ],
    sentence: { malay: "Saya tak minum alkohol, jus saja.", chinese: "我不喝酒，果汁就好。", scenario: "商务晚宴" },
    tip: "与穆斯林客户共进晚餐不提供酒精，选 Halal 餐厅，用 Jus/Teh Tarik 敬酒，生意在餐后聊。",
  },
  {
    theme: "[ 物流发货 ]",
    words: [
      { malay: "Penghantaran", pronunciation: "彭汉塔兰", chinese: "发货/配送", english: "Delivery" },
      { malay: "Pesanan", pronunciation: "佩萨南", chinese: "订单", english: "Order" },
      { malay: "Diterima", pronunciation: "迪特利马", chinese: "已收到", english: "Received" },
      { malay: "Lewat", pronunciation: "勒瓦", chinese: "迟", english: "Late" },
      { malay: "Lacak", pronunciation: "拉查", chinese: "追踪", english: "Track" },
    ],
    sentence: { malay: "Pesanan sudah dihantar, boleh lacak.", chinese: "订单已发货，可以追踪。", scenario: "通知客户发货" },
    tip: "大马物流常用 Pos Laju（邮政）/GDex/J&T，跟踪单号可在官网查询，东马（沙巴砂拉越）加收偏远费。",
  },
  {
    theme: "[ 售后服务 ]",
    words: [
      { malay: "Khidmat selepas jualan", pronunciation: "吉德马特 色帕来 朱兰", chinese: "售后服务", english: "After-sales service" },
      { malay: "Baiki", pronunciation: "拜基", chinese: "修理", english: "Repair" },
      { malay: "Tukar", pronunciation: "杜卡", chinese: "更换", english: "Exchange" },
      { malay: "Pulang", pronunciation: "普朗", chinese: "退货", english: "Return" },
      { malay: "Pertanyaan", pronunciation: "庞塔尼安", chinese: "咨询", english: "Inquiry" },
    ],
    sentence: { malay: "Ada masalah? Boleh tukar yang baru.", chinese: "有问题吗？可以换新的。", scenario: "售后处理" },
    tip: "马来消费者重视服务态度，快速响应（Segera）和主动换货（Tukar）能建立长期信任，胜过解释。",
  },
];

const ADVANCED_THEMES: { theme: string; words: MalayWord[]; sentence: { malay: string; chinese: string; scenario: string }; tip: string }[] = [
  {
    theme: "[ 工厂安全沟通 ]",
    words: [
      { malay: "Kilang", pronunciation: "基朗", chinese: "工厂", english: "Factory" },
      { malay: "Selamat", pronunciation: "色拉马特", chinese: "安全", english: "Safe" },
      { malay: "Bahaya", pronunciation: "巴哈亚", chinese: "危险", english: "Danger" },
      { malay: "Topi keselamatan", pronunciation: "托比 柯色拉马丹", chinese: "安全帽", english: "Safety helmet" },
      { malay: "Kawasan terhad", pronunciation: "卡瓦桑 特哈德", chinese: "限制区域", english: "Restricted area" },
    ],
    sentence: { malay: "Ini kawasan terhad, pakai topi keselamatan.", chinese: "这里是限制区域，请戴安全帽。", scenario: "工厂安全提醒" },
    tip: "进工厂必须戴安全帽（Topi keselamatan）和安全鞋，拍照前问是否允许，部分区域禁止手机。",
  },
  {
    theme: "[ 清真合规沟通 ]",
    words: [
      { malay: "JAKIM", pronunciation: "贾钦", chinese: "伊斯兰发展局", english: "JAKIM" },
      { malay: "Pensijilan", pronunciation: "彭西吉兰", chinese: "认证", english: "Certification" },
      { malay: "Bahan", pronunciation: "巴汉", chinese: "原料", english: "Ingredient" },
      { malay: "Babi", pronunciation: "巴比", chinese: "猪", english: "Pig" },
      { malay: "Arak", pronunciation: "阿拉", chinese: "酒", english: "Alcohol" },
    ],
    sentence: { malay: "Produk ini bebas babi dan arak.", chinese: "这款产品不含猪和酒。", scenario: "清真认证审核" },
    tip: "Halal 认证由 JAKIM 颁发，全流程不含猪（Babi）和酒精（Arak），认证周期 3-6 个月，找本地代理加速。",
  },
  {
    theme: "[ 政府部门对接 ]",
    words: [
      { malay: "Kementerian", pronunciation: "肯门特里安", chinese: "部", english: "Ministry" },
      { malay: "Jabatan", pronunciation: "扎巴丹", chinese: "局/部门", english: "Department" },
      { malay: "Permohonan", pronunciation: "彭莫霍南", chinese: "申请", english: "Application" },
      { malay: "Dokumen", pronunciation: "多库门", chinese: "文件", english: "Document" },
      { malay: "Lulus", pronunciation: "卢鲁斯", chinese: "批准/通过", english: "Approved/Pass" },
    ],
    sentence: { malay: "Permohonan ini sudah lulus.", chinese: "这份申请已批准。", scenario: "政府审批结果" },
    tip: "马来政府部门办事慢，需提前预约，带齐文件（Dokumen），说 Bahasa Melayu 比英文更受礼遇。",
  },
  {
    theme: "[ 海关与清关 ]",
    words: [
      { malay: "Kastam", pronunciation: "卡斯达姆", chinese: "海关", english: "Customs" },
      { malay: "Cukai", pronunciation: "祖卡", chinese: "税", english: "Tax" },
      { malay: "Import", pronunciation: "因博", chinese: "进口", english: "Import" },
      { malay: "Wartel", pronunciation: "瓦特尔", chinese: "申报", english: "Declaration" },
      { malay: "Kuarantin", pronunciation: "夸兰丁", chinese: "检疫", english: "Quarantine" },
    ],
    sentence: { malay: "Barang import ini kena cukai.", chinese: "这批进口货需要缴税。", scenario: "海关清关" },
    tip: "大马进口税 SST 8%（销售服务税），电子产品和食品税率不同，找 licensed forwarder 清关更快。",
  },
  {
    theme: "[ 劳动法与员工 ]",
    words: [
      { malay: "Pekerja", pronunciation: "佩科加", chinese: "员工", english: "Worker/employee" },
      { malay: "Gaji", pronunciation: "加吉", chinese: "工资", english: "Salary" },
      { malay: "Cuti", pronunciation: "朱蒂", chinese: "假期", english: "Leave" },
      { malay: "Sebab", pronunciation: "色巴", chinese: "原因", english: "Reason" },
      { malay: "HR", pronunciation: "H R", chinese: "人力资源", english: "HR" },
    ],
    sentence: { malay: "Saya nak ambil cuti sakit.", chinese: "我要请病假。", scenario: "员工请假" },
    tip: "大马劳动法规定年假最少 14 天，病假 14-22 天，1 月 1 日是公共假期，加班需付 1.5-3 倍工资。",
  },
  {
    theme: "[ 危机公关 ]",
    words: [
      { malay: "Kecemasan", pronunciation: "柯贾马桑", chinese: "紧急", english: "Emergency" },
      { malay: "Kenyataan", pronunciation: "肯雅坦", chinese: "声明", english: "Statement" },
      { malay: "Minta maaf", pronunciation: "明达 马阿夫", chinese: "道歉", english: "Apologize" },
      { malay: "Pulihkan", pronunciation: "普利坎", chinese: "恢复", english: "Recover" },
      { malay: "Kepercayaan", pronunciation: "柯珀查亚安", chinese: "信任", english: "Trust" },
    ],
    sentence: { malay: "Kita minta maaf dan akan pulihkan segera.", chinese: "我们道歉并将立即恢复。", scenario: "危机公关回应" },
    tip: "马来客户重视真诚道歉（Minta maaf），先认错再给方案，公开声明（Kenyataan）要双语发布。",
  },
  {
    theme: "[ 跨文化融入 ]",
    words: [
      { malay: "Budaya", pronunciation: "布达亚", chinese: "文化", english: "Culture" },
      { malay: "Hormat", pronunciation: "霍尔马特", chinese: "尊重", english: "Respect" },
      { malay: "Adat", pronunciation: "阿达", chinese: "习俗", english: "Custom" },
      { malay: "Lain", pronunciation: "莱恩", chinese: "不同", english: "Different" },
      { malay: "Faham", pronunciation: "法姆", chinese: "明白", english: "Understand" },
    ],
    sentence: { malay: "Saya faham adat orang Melayu.", chinese: "我了解马来人的习俗。", scenario: "表达文化理解" },
    tip: "Hormat（尊重）是跨文化核心，了解 Adat（习俗）并尊重，比会说流利马来语更重要，左手递物是大忌。",
  },
  {
    theme: "[ 长期合作维护 ]",
    words: [
      { malay: "Kerjasama", pronunciation: "柯加萨马", chinese: "合作", english: "Cooperation" },
      { malay: "Jangka panjang", pronunciation: "蒋加 庞江", chinese: "长期", english: "Long-term" },
      { malay: "Setia", pronunciation: "色蒂亚", chinese: "忠诚", english: "Loyal" },
      { malay: "Berkembang", pronunciation: "伯康邦", chinese: "发展", english: "Develop" },
      { malay: "Bersama", pronunciation: "伯萨马", chinese: "一起", english: "Together" },
    ],
    sentence: { malay: "Kita kerjasama jangka panjang.", chinese: "我们长期合作。", scenario: "巩固合作关系" },
    tip: "马来人重视长期关系，节日送小礼（开斋节/华人新年），定期拜访比邮件催单更能维系 Kerjasama。",
  },
  {
    theme: "[ 本地资源对接 ]",
    words: [
      { malay: "Sumber tempatan", pronunciation: "苏姆博 丹布丹", chinese: "本地资源", english: "Local resource" },
      { malay: "Pembekal", pronunciation: "彭贝卡", chinese: "供应商", english: "Supplier" },
      { malay: "Agensi", pronunciation: "阿根西", chinese: "代理/机构", english: "Agency" },
      { malay: "Hubungan", pronunciation: "鲁班干", chinese: "关系", english: "Relationship" },
      { malay: "Rujukan", pronunciation: "鲁朱坎", chinese: "引荐/参考", english: "Referral" },
    ],
    sentence: { malay: "Boleh rujuk pembekal tempatan ini?", chinese: "可以引荐这家本地供应商吗？", scenario: "资源对接请求" },
    tip: "大马商界靠 Hubungan（关系），请已合作的客户做 Rujukan（引荐）比陌拜有效 10 倍，先做人再做生意。",
  },
  {
    theme: "[ 毕业复盘：出海全流程 ]",
    words: [
      { malay: "Merancang", pronunciation: "梅兰张", chinese: "规划", english: "Plan" },
      { malay: "Melaksana", pronunciation: "梅拉克萨纳", chinese: "执行", english: "Execute" },
      { malay: "Nilaian", pronunciation: "尼来安", chinese: "评估", english: "Evaluation" },
      { malay: "Penambahbaikan", pronunciation: "彭拿巴伊坎", chinese: "改进", english: "Improvement" },
      { malay: "Kejayaan", pronunciation: "柯加亚安", chinese: "成功", english: "Success" },
    ],
    sentence: { malay: "Dari merancang hingga kejayaan.", chinese: "从规划到成功。", scenario: "出海全流程复盘" },
    tip: "恭喜完成 90 天马来语打卡！你已具备大马日常与商务沟通基础，下一步：找本地朋友对话练习，Jom 出海！",
  },
];

// 生成 Day 31-90：每 10 天复用一个主题模块
function generateLessons(): DailyLesson[] {
  const all: DailyLesson[] = [...MALAY_LESSONS];

  // Day 31-60：商务沟通 30 天
  for (let i = 0; i < 30; i++) {
    const day = 31 + i;
    const template = BUSINESS_THEMES[i % BUSINESS_THEMES.length];
    all.push({
      day,
      theme: template.theme,
      words: template.words,
      sentence: template.sentence,
      tip: template.tip,
    });
  }

  // Day 61-90：深度场景 30 天
  for (let i = 0; i < 30; i++) {
    const day = 61 + i;
    const template = ADVANCED_THEMES[i % ADVANCED_THEMES.length];
    all.push({
      day,
      theme: template.theme,
      words: template.words,
      sentence: template.sentence,
      tip: template.tip,
    });
  }

  return all;
}

export const ALL_LESSONS: DailyLesson[] = generateLessons();

// ============================================================
// 日期工具 + 课程查找（进度驱动，非全局 hash）
// ============================================================
export function getUTC8DateKey(): string {
  const now = new Date();
  const utc8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const y = utc8.getUTCFullYear();
  const m = String(utc8.getUTCMonth() + 1).padStart(2, "0");
  const d = String(utc8.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 获取东八区昨天的日期 key（用于判断是否连续打卡）
export function getYesterdayDateKey(): string {
  const now = new Date();
  const utc8 = new Date(now.getTime() + 8 * 60 * 60 * 1000 - 86400000);
  const y = utc8.getUTCFullYear();
  const m = String(utc8.getUTCMonth() + 1).padStart(2, "0");
  const d = String(utc8.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getLessonByDay(day: number): DailyLesson {
  // 防御性校验：处理 NaN/undefined/非正整数
  if (!day || typeof day !== "number" || !Number.isFinite(day) || day < 1) {
    return ALL_LESSONS[0];
  }
  const safeDay = ((day - 1) % 90) + 1;
  return ALL_LESSONS.find((l) => l.day === safeDay) || ALL_LESSONS[0];
}
