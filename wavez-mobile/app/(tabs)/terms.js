import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, I18nManager, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Home, MapPin, TrendingUp } from 'lucide-react-native';

// Make sure RTL is enforced if needed globally
try {
  I18nManager.forceRTL(true);
  I18nManager.allowRTL(true);
} catch (e) { }

export default function TermsScreen() {
  return (
    <View style={styles.container}>
      {/* Main Content Area */}
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-forward" size={24} color="#38bdf8" />
          </TouchableOpacity>
          <Text style={styles.title}>תנאי שימוש ונגישות</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>

          <Text style={styles.sectionHeader}>הצהרת נגישות</Text>
          <Text style={styles.bodyText}>תאריך עדכון אחרון: 11.04.2026</Text>
          <Text style={styles.bodyText}>כללי: WAVEZ PRO (עוסק פטור ע.פ. 211900733) רואה חשיבות עליונה בהנגשת אתר האינטרנט שלה לאנשים עם מוגבלות. מושקעים משאבים רבים להפיכת האתר לנגיש מתוך אמונה בזכות לחיות בכבוד, בשוויון, בנוחות ובעצמאות.</Text>
          <Text style={styles.bodyText}>רמת הנגישות: האתר נבנה בהתאם לתקן ישראלי 5568 ברמה AA (חלקי). ההתאמות בוצעו לפי המלצות התקן הישראלי והתקן הבינלאומי WCAG 2.0.</Text>
          <Text style={styles.subHeader}>התאמות שבוצעו:</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• התאמה וצפייה בדפדפנים נפוצים.</Text>
            <Text style={styles.bulletItem}>• כתיבה בשפה ברורה ומובנת.</Text>
            <Text style={styles.bulletItem}>• ניווט נוח ותפריטים מבוססי רשימות.</Text>
            <Text style={styles.bulletItem}>• אתר רספונסיבי לרזולוציות שונות.</Text>
            <Text style={styles.bulletItem}>• הסבר טקסטואלי חלופי (Alt Text) למרבית התמונות.</Text>
            <Text style={styles.bulletItem}>• שינוי גודל גופן באמצעות המקלדת (CTRL + / -).</Text>
            <Text style={styles.bulletItem}>• הימנעות מטקסט מהבהב, נע או מרצד.</Text>
          </View>
          <Text style={styles.bodyText}>פרטי רכז נגישות: ניתן לפנות לדיווח על בעיות או לקבלת עזרה בדוא"ל: giladbecher@gmail.com</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionHeader}>מדיניות פרטיות</Text>
          <Text style={styles.bodyText}>פרטי העסק: WAVEZ PRO עוסק פטור ע.פ. 211900733. כתובת רשומה: שרעבי 3 הרצליה.</Text>
          <Text style={styles.bodyText}>תאריך עדכון: 1.04.2026.</Text>
          <Text style={styles.bodyText}>דוא"ל לפניות: giladbecher@gmail.com</Text>
          <Text style={styles.bodyText}>עיבוד נתונים B2B: העסק פועל כ"מחזיק" או "מעבד" בלבד עבור נתוני צד שלישי המועלים על ידי משתמשים עסקיים ("בעלי המאגר"). האחריות לחוקיות המידע והשגת הסכמות חלה על המשתמש העסקי.</Text>

          <Text style={styles.subHeader}>איסוף מידע ושימוש בו</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>סוגי מידע:</Text> נאספת כתובת דוא"ל. מידע טכני (IP, מיקום, מזהים דיגיטליים) נחשב למידע אישי לפי תיקון 13 לחוק הגנת הפרטיות.</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>הסכמה:</Text> מסירת המידע אינה חובה חוקית ותלויה ברצון המשתמש, אך אי-מסירתו עלולה לגרור חסימת שירות.</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>מטרות השימוש:</Text> תמיכה טכנית, ניתוח שימוש, אספקת השירות, ושיווק (בכפוף להסכמה).</Text>

          <Text style={styles.subHeader}>תקופת שמירה:</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• מידע פיננסי: 7 שנים.</Text>
            <Text style={styles.bulletItem}>• מידע טכני ואנליטי: עד 24 חודשים.</Text>
          </View>

          <Text style={styles.subHeader}>בינה מלאכותית וסטטיסטיקה</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>מידע מותמם:</Text> העסק שומר זכות להשתמש במידע אנונימי למחקר, מכירה לצד ג', ואימון מודלי AI ללא תמורה למשתמש.</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>שקיפות אלגוריתמית:</Text> חלק מהחלטות השירות או קביעת המחירים עשויות להתבצע באופן אוטומטי על ידי מערכות AI.</Text>

          <Text style={styles.subHeader}>אבטחת מידע והעברה לצד ג'</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>רמת אבטחה:</Text> רמה בינונית (רמה 3), כולל מינוי ממונה הגנת פרטיות (DPO), ביקורות תקופתיות, נהלי סיסמאות ומעקב גישות.</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>ספקים וצדדים שלישיים:</Text></Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• אחסון: Vercel (ארה"ב) ו-Supabase.</Text>
            <Text style={styles.bulletItem}>• שיווק וניתוח: מערכות דיוור ושירותי ניתוח סטטיסטי.</Text>
            <Text style={styles.bulletItem}>• בינה מלאכותית: Custom AI.</Text>
          </View>
          <Text style={styles.bodyText}><Text style={styles.boldText}>העברה בינלאומית:</Text> חלק מהספקים עשויים להימצא מחוץ לישראל, תחת מנגנונים משפטיים נאותים.</Text>

          <Text style={styles.subHeader}>זכויות המשתמש ודיווח</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>זכויות לפי חוק:</Text> זכות העיון במידע, זכות התיקון/מחיקה וזכות ה"הישכחות".</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>דואר זבל:</Text> הסרה מרשימת תפוצה תתאפשר בכל עת ובאותה דרך בה נשלח המסר.</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>אירוע אבטחה:</Text> במקרה של אירוע חמור, יבוצע דיווח לרשות להגנת הפרטיות ולהודעה לנפגעים במידת הצורך.</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionHeader}>תקנון שימוש באתר</Text>
          <Text style={styles.bodyText}>פרטי העסק: WAVEZ PRO ע.פ. 211900733, שרעבי 3 הרצליה.</Text>
          <Text style={styles.bodyText}>תאריך עדכון: 1.04.2026.</Text>
          <Text style={styles.bodyText}>הסכמה: השימוש באתר מהווה הסכמה מלאה ובלתי חוזרת לתנאים אלו.</Text>

          <Text style={styles.subHeader}>זכאות ואיסורים</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>גיל:</Text> מותר לכל גיל; מתחת לגיל 13 נדרשת הסכמת אפוטרופוס.</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>חסימה:</Text> העסק רשאי לחסום משתמשים במקרה של הפרה יסודית, בדרך כלל לאחר הודעה מוקדמת.</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>פעולות אסורות:</Text> העתקה/הפצה מסחרית ללא אישור, שימוש בסימנים מסחריים, פעולות אלימות או הטרדה, העלאת תוכן לא חוקי, ועקיפת אבטחה.</Text>

          <Text style={styles.subHeader}>מדיניות כספית ושירות</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>ביטולים:</Text> בהתאם לחוק הגנת הצרכן. תונפק קבלה דיגיטלית לפי תיקון 73.</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>זמינות:</Text> אין התחייבות לזמינות מוחלטת ללא תקלות.</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>תקופת ניסיון:</Text> 7 ימים, שלאחריהם נדרשת הסכמה לחיוב. הגיבויים באחריות הלקוח.</Text>

          <Text style={styles.subHeader}>קניין רוחני</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>בעלות:</Text> קוד המקור, מערכת ה-SaaS, הלוגו ובסיסי הנתונים שייכים בלעדית ל-WAVEZ PRO.</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>משוב:</Text> כל רעיון או הצעה שיימסרו יהפכו לקניין העסק ללא תמורה.</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>איסור כריית נתונים:</Text> חל איסור מוחלט על שימוש בבוטים, Spiders או Crawlers לשאיבת מידע או אימון מודלי AI.</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>שימוש הוגן:</Text> חל איסור על הורדה סיטונאית או "אגירת מידע" (Hoarding).</Text>

          <Text style={styles.subHeader}>אחריות ושיפוי</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>השירות ניתן "כפי שהוא" (AS IS):</Text> ללא התחייבות לזמינות רציפה או שלמות נתונים.</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>הגבלת אחריות:</Text> חבות העסק מוגבלת לסכום ששולם ב-12 החודשים האחרונים או 10,000 ש"ח (הגבוה מביניהם). הגבלה זו לא תחול על נזקי גוף, הפרת פרטיות או מעשה זדון.</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>שיפוי:</Text> המשתמש ישפה את העסק על נזקים עקב הפרה יסודית של התנאים.</Text>

          <Text style={styles.subHeader}>דין, שיפוט ויישוב סכסוכים</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>סמכות שיפוט:</Text> הדין הישראלי, בתי המשפט במחוז תל אביב-יפו.</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>בוררות:</Text> סכסוכים עסקיים (B2B) יוכרעו על ידי בורר דן יחיד לאחר ניסיון יישוב של 30 יום.</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>תובענה ייצוגית:</Text> ויתור על הזכות להשתתף בתובענה ייצוגית בסביבת B2B.</Text>

          <Text style={styles.subHeader}>שונות</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>עדכונים:</Text> הודעה על שינוי מהותי תינתן 30 ימים מראש.</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>כוח עליון:</Text> העסק לא יישא באחריות לעיכובים עקב מלחמה, טרור, מגיפה, אסונות טבע, תקלות תשתית או צווים ממשלתיים.</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>הפרדת סעיפים:</Text> אם סעיף יבוטל, יתר ההוראות יישארו בתוקף.</Text>
          <Text style={styles.bodyText}><Text style={styles.boldText}>המחאת זכויות:</Text> העסק רשאי להעביר זכויותיו לצד ג' בהודעה של 30 יום. המשתמש אינו רשאי להמחות זכויות ללא אישור בכתב.</Text>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/')}>
          <Home color={'#64748b'} size={20} />
          <Text style={styles.navText}>ראשי</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/')}>
          <MapPin color={'#64748b'} size={20} />
          <Text style={styles.navText}>מפה</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/')}>
          <TrendingUp color={'#64748b'} size={20} />
          <Text style={styles.navText}>תחזית</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 45,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    padding: 10,
    width: 50,
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  sectionHeader: {
    color: '#38bdf8',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'right',
  },
  subHeader: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'right',
  },
  bodyText: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
    textAlign: 'right',
  },
  boldText: {
    fontWeight: 'bold',
    color: 'white',
  },
  bulletList: {
    marginBottom: 16,
    paddingRight: 10,
  },
  bulletItem: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 6,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 24,
    width: '80%',
    alignSelf: 'center',
  },
  // Bottom Nav Styles consistent with index.js
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'space-between'
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
    minHeight: 50,
    justifyContent: 'center'
  },
  navText: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 4
  },
});
