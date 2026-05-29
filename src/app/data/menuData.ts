/**
 * Menu data layer.
 *
 * This file is the single source of truth for all menu items, categories,
 * and localized strings. It is intentionally decoupled from the UI so it
 * can later be swapped for a Supabase / API-backed loader without touching
 * any React components.
 *
 * Future integration notes:
 *   - Replace `menuItems` and `categoryList` with async fetchers from Supabase.
 *   - Resolve `restaurantId` from the QR-route slug for multi-tenant support.
 *   - Push translations into a `translations` table keyed by item_id + locale.
 */

export type Lang = "en" | "hi" | "te";

export type FoodTag = "best" | "spicy" | "chef";

export type Category = {
  id: string;
  labelKey: string;
  emoji: string;
};

export type MenuItem = {
  id: number;
  cat: string;
  price: number;
  veg: boolean;
  emoji: string;
  img: string;
  tags: FoodTag[];
};

export const categoryList: Category[] = [
  { id: "all", labelKey: "cat-all", emoji: "🍽" },
  { id: "biryani", labelKey: "cat-biryani", emoji: "🍛" },
  { id: "starters", labelKey: "cat-starters", emoji: "🍗" },
  { id: "breads", labelKey: "cat-breads", emoji: "🫓" },
  { id: "drinks", labelKey: "cat-drinks", emoji: "☕" },
  { id: "desserts", labelKey: "cat-desserts", emoji: "🍮" },
];

export const menuItems: MenuItem[] = [
  { id: 1, cat: "biryani", price: 299, veg: false, emoji: "🍛", img: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&auto=format&fit=crop&q=80", tags: ["best", "spicy"] },
  { id: 2, cat: "biryani", price: 199, veg: true, emoji: "🍚", img: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=200&auto=format&fit=crop&q=80", tags: [] },
  { id: 3, cat: "biryani", price: 249, veg: false, emoji: "🥘", img: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=200&auto=format&fit=crop&q=80", tags: ["best"] },
  { id: 4, cat: "starters", price: 189, veg: false, emoji: "🍗", img: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=200&auto=format&fit=crop&q=80", tags: ["spicy", "best"] },
  { id: 5, cat: "starters", price: 159, veg: true, emoji: "🧀", img: "https://images.unsplash.com/photo-1567188040759-fb8a883db6d8?w=200&auto=format&fit=crop&q=80", tags: ["chef"] },
  { id: 6, cat: "starters", price: 229, veg: false, emoji: "🥩", img: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=200&auto=format&fit=crop&q=80", tags: ["chef"] },
  { id: 7, cat: "breads", price: 49, veg: true, emoji: "🫓", img: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=200&auto=format&fit=crop&q=80", tags: [] },
  { id: 8, cat: "breads", price: 39, veg: true, emoji: "🫓", img: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=200&auto=format&fit=crop&q=80", tags: ["best"] },
  { id: 9, cat: "drinks", price: 49, veg: true, emoji: "☕", img: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=200&auto=format&fit=crop&q=80", tags: ["best"] },
  { id: 10, cat: "drinks", price: 79, veg: true, emoji: "🥛", img: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=200&auto=format&fit=crop&q=80", tags: [] },
  { id: 11, cat: "drinks", price: 59, veg: true, emoji: "🍋", img: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=200&auto=format&fit=crop&q=80", tags: [] },
  { id: 12, cat: "desserts", price: 99, veg: true, emoji: "🍮", img: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=200&auto=format&fit=crop&q=80", tags: ["best"] },
  { id: 13, cat: "desserts", price: 89, veg: true, emoji: "🍑", img: "https://images.unsplash.com/photo-1548849186-57bd530ecd3d?w=200&auto=format&fit=crop&q=80", tags: [] },
];

export const languageDict: Record<Lang, Record<string, string>> = {
  en: {
    "loc-table": "🍽 TABLE 4",
    "loc-kitchen": "KITCHEN OPEN",
    "loc-title": "Spice Garden",
    "loc-sub": "Authentic Hyderabadi Cuisine",
    "loc-rating": "4.7",
    "loc-prep": "15-20 min",
    "loc-pop": "Popular",
    "loc-view-cart": "View Cart",
    "loc-your-order": "Your Order 🛒",
    "loc-subtotal": "Subtotal",
    "loc-gst": "GST & Service tax (5%)",
    "loc-grandtotal": "Grand Total",
    "loc-pay-method": "PAYMENT METHOD",
    "loc-submit-order": "PLACE ORDER & PAY",
    "cat-all": "All Dishes",
    "cat-biryani": "Biryani",
    "cat-starters": "Starters",
    "cat-breads": "Breads",
    "cat-drinks": "Drinks",
    "cat-desserts": "Desserts",
    "item-1-name": "Hyderabadi Dum Biryani",
    "item-1-desc": "Slow-cooked long grain basmati rice with tender spiced mutton, caramelized onions & fresh raita",
    "item-2-name": "Veg Dum Biryani",
    "item-2-desc": "Rich layered rice cooked with seasonal vegetables, aromatic spices, served with thick salan",
    "item-3-name": "Chicken Biryani",
    "item-3-desc": "Tender spiced chicken pieces dum-cooked with long aromatic basmati rice & saffron milk",
    "item-4-name": "Chicken 65",
    "item-4-desc": "Classic local red fried chicken tossed in hot yoghurt sauce, curry leaves, and green chillies",
    "item-5-name": "Paneer Tikka",
    "item-5-desc": "Soft paneer cubes skewered with onions and bell peppers, grilled freshly inside our tandoor pot",
    "item-6-name": "Mutton Seekh Kebab",
    "item-6-desc": "Finely minced fresh mutton spiced with herbs, grilled on charcoal skewers, served hot with mint dip",
    "item-7-name": "Butter Naan",
    "item-7-desc": "Soft oven-baked leavened bread brushed generously with pure local cow butter",
    "item-8-name": "Garlic Roti",
    "item-8-desc": "Traditional whole wheat bread layered with fresh minced garlic and roasted coriander leaves",
    "item-9-name": "Irani Chai",
    "item-9-desc": "Hyderabad iconic strong creamy sweet tea brewed slow, paired best with crusty Osmania biscuit",
    "item-10-name": "Mango Lassi",
    "item-10-desc": "Thick sweetened yogurt blended with sweet ripe Alphonso mangoes, served chilled in clay glass",
    "item-11-name": "Fresh Lime Soda",
    "item-11-desc": "Fresh squeezed sour lemon soda, made to your selection of sweet, salted, or mixed",
    "item-12-name": "Double Ka Meetha",
    "item-12-desc": "Diner favorite golden fried bread pudding soaked in saffron syrup, thick cardamon rabri & nuts",
    "item-13-name": "Qubani Ka Meetha",
    "item-13-desc": "Traditional stewed dried apricot dessert sweetened, served topped with thick heavy fresh cream",
  },
  hi: {
    "loc-table": "🍽 मेज संख्या 4",
    "loc-kitchen": "रसोई चालू है",
    "loc-title": "स्पाइस गार्डन",
    "loc-sub": "असली हैदराबादी स्वाद",
    "loc-rating": "4.7",
    "loc-prep": "15-20 मिनट",
    "loc-pop": "लोकप्रिय",
    "loc-view-cart": "कार्ट देखें",
    "loc-your-order": "आपका ऑर्डर 🛒",
    "loc-subtotal": "कुल योग",
    "loc-gst": "जीएसटी और सेवा कर (5%)",
    "loc-grandtotal": "सकल योग",
    "loc-pay-method": "भुगतान का प्रकार",
    "loc-submit-order": "ऑर्डर करें और भुगतान करें",
    "cat-all": "सभी व्यंजन",
    "cat-biryani": "बिरयानी",
    "cat-starters": "शुरुआती भोजन",
    "cat-breads": "रोटियां",
    "cat-drinks": "पेय पदार्थ",
    "cat-desserts": "मिठाइयाँ",
    "item-1-name": "हैदराबादी दम बिरयानी",
    "item-1-desc": "धीमी आंच पर पके लंबे दाने वाले बासमती चावल, रसीले मटन, भुनी हुई प्याज और ताजे रायते के साथ",
    "item-2-name": "वेज दम बिरयानी",
    "item-2-desc": "ताजा मौसमी सब्जियों और सुगंधित मसालों से बनी शाही बिरयानी, गाढ़े मिर्च के सालन के साथ",
    "item-3-name": "चिकन बिरयानी",
    "item-3-desc": "सुगंधित बासमती चावल, मसालों में पके चिकन के टुकड़े और केसरिया दूध के साथ दम की हुई",
    "item-4-name": "चिकन 65",
    "item-4-desc": "दही, कढ़ी पत्ते और हरी मिर्च के साथ तली हुई हैदराबादी खास मसालेदार चिकन",
    "item-5-name": "पनीर टिक्का",
    "item-5-desc": "तंदूर में ग्रिल की हुई ताजी मलाई पनीर, शिमला मिर्च और प्याज के साथ मलाईदार मैरिनेशन में",
    "item-6-name": "मटन सीख कबाब",
    "item-6-desc": "बारीक पिसा हुआ मटन जड़ी-बूटियों के साथ, कोयले पर ग्रिल किया हुआ, पुदीने की चटनी के साथ",
    "item-7-name": "बटर नान",
    "item-7-desc": "तंदूर में पकी हुई मुलायम मैदा की रोटी, भरपूर गाय के मक्खन के साथ",
    "item-8-name": "गार्लिक रोटी",
    "item-8-desc": "बारीक कटे ताजे लहसुन और हरे धनिए के पत्तों से बनी पारंपरिक गेहूं की तंदूरी रोटी",
    "item-9-name": "इरानी चाय",
    "item-9-desc": "हैदराबाद की प्रसिद्ध गाढ़ी, मलाईदार मीठी चाय, कुरकुरे उस्मानिया बिस्कुट के साथ",
    "item-10-name": "मैंगो लस्सी",
    "item-10-desc": "गाढ़ा मीठा दही और पके हुए हापुस आम के पल्प का मिश्रण, मिट्टी के कुल्हड़ में परोसा गया",
    "item-11-name": "फ्रेश लाइम सोडा",
    "item-11-desc": "ताजा नींबू का सोडा, आपके स्वादानुसार मीठा, नमकीन या मिक्स",
    "item-12-name": "डबल का मीठा",
    "item-12-desc": "केसर की चाशनी, गाढ़ी इलायची वाली रबड़ी और मेवों से बना तला हुआ ब्रेड पुडिंग",
    "item-13-name": "खुबानी का मीठा",
    "item-13-desc": "मीठी चाशनी में पकाई गई खुबानी का पारंपरिक लाजवाब स्वाद, ताजी मलाई के साथ",
  },
  te: {
    "loc-table": "🍽 బల్ల సంఖ్య 4",
    "loc-kitchen": "వంటశాల తెరిచి ఉంది",
    "loc-title": "స్పైస్ గార్డెన్",
    "loc-sub": "అసలైన హైదరాబాదీ రుచులు",
    "loc-rating": "4.7",
    "loc-prep": "15-20 నిమిషాలు",
    "loc-pop": "అత్యంత ప్రజాదరణ",
    "loc-view-cart": "కార్ట్ చూడండి",
    "loc-your-order": "మీ ఆర్డర్ 🛒",
    "loc-subtotal": "మొత్తం వెల",
    "loc-gst": "జీఎస్టీ & సేవా పన్ను (5%)",
    "loc-grandtotal": "మొత్తం చెల్లించవలసినది",
    "loc-pay-method": "చెల్లింపు పద్ధతి",
    "loc-submit-order": "ఆర్డర్ ఖరారు చేసి చెల్లించండి",
    "cat-all": "అన్ని వంటకాలు",
    "cat-biryani": "బిర్యానీ",
    "cat-starters": "స్టార్టర్స్",
    "cat-breads": "రొట్టెలు",
    "cat-drinks": "పానీయాలు",
    "cat-desserts": "మిఠాయిలు",
    "item-1-name": "హైదరాబాదీ దమ్ బిర్యానీ",
    "item-1-desc": "సన్నని బాస్మతి బియ్యం, మెత్తని మటన్ ముక్కలు, వేయించిన ఉల్లిపాయలు మరియు రాయతాతో చేసిన దమ్ బిర్యానీ",
    "item-2-name": "వెజ్ దమ్ బిర్యానీ",
    "item-2-desc": "తాజా కూరగాయలు మరియు సుగంధ ద్రవ్యాలతో వండిన రాయల్ బిర్యానీ, మిర్చి కా సలాన్‌తో",
    "item-3-name": "చికెన్ బిర్యానీ",
    "item-3-desc": "మసాలాలు దట్టించిన చికెన్ ముక్కలు, పొడవాటి బాస్మతి బియ్యంతో చేసిన అద్భుతమైన బిర్యానీ",
    "item-4-name": "చికెన్ 65",
    "item-4-desc": "మసాలాలు, పెరుగు, కరివేపాకు, పచ్చిమిర్చితో వేయించిన క్లాసిక్ హైదరాబాదీ చికెన్ వేపుడు",
    "item-5-name": "పన్నీర్ టిక్కా",
    "item-5-desc": "ఉల్లిపాయలు, బెల్ పెప్పర్స్‌తో పాటు తందూర్‌లో కాల్చిన మెత్తని పన్నీర్ ముక్కలు",
    "item-6-name": "మటన్ సీఖ్ కబాబ్",
    "item-6-desc": "మెత్తని మటన్ కీమాను సుగంధ ద్రవ్యాలతో కలిపి బొగ్గులపై కాల్చిన కబాబ్, పుదీనా పచ్చడితో",
    "item-7-name": "బటర్ నాన్",
    "item-7-desc": "తందూరి పోయ్యిలో కాల్చిన మెత్తని రొట్టె, పైన వెన్న పూతతో",
    "item-8-name": "గార్లిక్ రోటి",
    "item-8-desc": "సన్నగా తరిగిన వెల్లుల్లి మరియు కొత్తిమీర చల్లి కాల్చిన గోధుమ రొట్టె",
    "item-9-name": "ఇరానీ చాయ్",
    "item-9-desc": "హైదరాబాద్ ప్రత్యేకమైన చిక్కటి పాలు, చక్కెరతో మరిగించిన ఇరానీ చాయ్, ఉస్మానియా బిస్కెట్లతో",
    "item-10-name": "మ్యాంగో లస్సీ",
    "item-10-desc": "తాజా అల్ఫోన్సో మామిడి పండ్లతో చిలికిన చల్లటి చిక్కటి పెరుగు లస్సీ",
    "item-11-name": "ఫ్రెష్ లైమ్ సోడా",
    "item-11-desc": "తాజా నిమ్మరసం సోడా, మీ రుచికి తగినట్లుగా తీపి, ఉప్పు లేదా రెండు కలిపి",
    "item-12-name": "డబుల్ కా మీఠా",
    "item-12-desc": "కేసరి సిరప్, చిక్కటి యాలకుల రబ్రీ మరియు డ్రై ఫ్రూట్స్‌తో చేసిన సాంప్రదాయ బ్రెడ్ పుడ్డింగ్",
    "item-13-name": "ఖుబానీ కా మీఠా",
    "item-13-desc": "తీపి పాకంలో ఉడికించిన ప్రత్యేకమైన జల్దరు పండు స్వీట్, పైన తాజా క్రీమ్‌తో",
  },
};
