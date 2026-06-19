import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, I18nManager, ScrollView } from 'react-native';
import { router } from 'expo-router';

// Make sure RTL is enforced if needed globally
try {
  I18nManager.forceRTL(true);
  I18nManager.allowRTL(true);
} catch (e) { }

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>חזור</Text>
        </TouchableOpacity>
        <Text style={styles.title}>תנאי שימוש ונגישות</Text>
        <View style={{ width: 50 }} />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        
        {/* נגישות */}
        <Text style={styles.h1}>הצהרת נגישות</Text>
        <Text style={styles.date}>עדכון אחרון: 11.04.2026</Text>
        <Text style={styles.p}>WAVEZ PRO עוסק פטור ע.פ. 211900733 רואה חשיבות עליונה בהנגשת אתר האינטרנט שלה לאנשים עם מוגבלות. אנו משקיעים משאבים רבים על מנת להפוך את האתר לנגיש, מתוך אמונה כי לכל אדם מגיעה הזכות לחיות בכבוד, בשוויון, בנוחות ובעצמאות.</Text>
        
        <Text style={styles.h2}>רמת הנגישות באתר</Text>
        <Text style={styles.p}>האתר נבנה בהתאם להוראות תקן ישראלי 5568 ("קווים מנחים לנגישות תכנים באינטרנט") ברמה AA (חלקי). התאמות הנגישות בוצעו עפ"י המלצות התקן הישראלי (ת"י 5568) ולתקן הבינלאומי WCAG 2.0.</Text>

        <Text style={styles.h2}>התאמות הנגישות שבוצעו באתר</Text>
        <View style={styles.bulletList}>
          <Text style={styles.li}>• האתר מותאם לצפייה ונתמך על ידי הדפדפנים הנפוצים.</Text>
          <Text style={styles.li}>• תכני האתר נכתבו בשפה ברורה, קריאה ומובנת.</Text>
          <Text style={styles.li}>• מבנה האתר מושתת על ניווט נוח וברור ותפריטים הבנויים באמצעות רשימות המאפשרות התמצאות קלה.</Text>
          <Text style={styles.li}>• האתר מותאם לגלישה בסביבת עבודה ברזולוציות שונות (רספונסיבי).</Text>
          <Text style={styles.li}>• למרבית התמונות באתר ישנו הסבר טקסטואלי חלופי (Alt Text).</Text>
          <Text style={styles.li}>• האתר מאפשר שינוי גודל הגופן על ידי שימוש במקלדת (CTRL + / -).</Text>
          <Text style={styles.li}>• אין באתר שימוש בטקסט מהבהב, נע או מרצד.</Text>
        </View>

        <Text style={styles.h2}>פרטי רכז נגישות</Text>
        <Text style={styles.p}>אם נתקלתם בבעיה בנושא נגישות באתר, או אם אתם זקוקים לעזרה, נשמח לקבל מכם משוב.{"\n"}ניתן לפנות אלינו בנושא נגישות דרך הדוא"ל: giladbecher@gmail.com</Text>

        <View style={styles.separator} />

        {/* פרטיות */}
        <Text style={styles.h1}>מדיניות פרטיות</Text>
        <Text style={styles.p}>WAVEZ PRO עוסק פטור ע.פ. 211900733 (להלן: "העסק") מחויב להגן על פרטיותך. מדיניות זו מפרטת את אופן איסוף והשימוש במידע, בהתאם לחוק הגנת הפרטיות, התשמ"א-1981 ותקנותיו.</Text>

        <Text style={styles.h2}>1. איסוף מידע</Text>
        <Text style={styles.p}><Text style={styles.bold}>1.1 שקיפות באיסוף מידע:</Text> בשל אופי השירות ופעילות האתר, אנו אוספים ומעבדים כתובת דוא"ל. מידע טכני כגון כתובת IP, נתוני מיקום ומזהים דיגיטליים נחשב למידע אישי לכל דבר ועניין.</Text>
        <Text style={styles.p}><Text style={styles.bold}>1.2 חובת מסירת מידע והסכמה:</Text> לא חלה עליך חובה חוקית למסור את המידע, ומסירתו תלויה ברצונך ובהסכמתך המלאה.</Text>

        <Text style={styles.h2}>2. מטרות השימוש במידע</Text>
        <Text style={styles.p}>המידע ישמש את העסק למטרות תמיכה טכנית, ניתוח ושיפור השירות, אספקת השירות, ושיווק (בכפוף להסכמה). המידע יישמר למשך כל תקופת מתן השירות וכל עוד קיימת עילה משפטית לשמירתו.</Text>
        <Text style={styles.p}><Text style={styles.bold}>שימוש במידע מותמם (סטטיסטי):</Text> מובהר בזאת כי העסק אוסף מידע סטטיסטי מותמם על דפוסי השימוש במערכת. העסק שומר לעצמו את הזכות המלאה לעשות במידע סטטיסטי אנונימי זה כל שימוש, לרבות אימון מודלי בינה מלאכותית (AI) או אלגוריתמים.</Text>

        <Text style={styles.h2}>3. אבטחת מידע</Text>
        <Text style={styles.p}>אנו נוקטים באמצעי אבטחת מידע בהתאם לדרישות החוק. רמת אבטחה בינונית (רמה 3) מיושמת, הכוללת ממונה הגנת פרטיות (DPO), ביקורות תקופתיות, נהלי סיסמאות מורכבים וניהול גישות.</Text>

        <Text style={styles.h2}>4. העברת מידע לצד שלישי</Text>
        <Text style={styles.p}>אנו עשויים לשתף מידע רק עם גופים חיוניים לצורך מתן השירות, כגון שירותי דיוור (למשל מערכות ניהול לקוחות), שירותי ניתוח סטטיסטיים, ותשתיות ענן (כגון Vercel, Supabase). העברה בינלאומית תתבצע בכפוף למנגנונים משפטיים נאותים.</Text>

        <Text style={styles.h2}>5. זכויות המשתמש</Text>
        <Text style={styles.p}>חוק הגנת הפרטיות מקנה לך את הזכות לעיין במידע המוחזק עליך, לבקש את תיקונו או מחיקתו (הישכחות). ניתן לבקש הסרה מרשימת התפוצה בכל עת.</Text>

        <View style={styles.separator} />

        {/* תקנון */}
        <Text style={styles.h1}>תקנון שימוש באתר</Text>

        <Text style={styles.h2}>1. הגדרות וכללי</Text>
        <Text style={styles.p}>המסמך שלפניך מסדיר את היחסים המשפטיים בין העסק לבין כל אדם העושה שימוש באתר. השימוש באתר מהווה הסכמה מלאה, מדעת ובלתי חוזרת לכל האמור בתנאי שימוש אלו.</Text>

        <Text style={styles.h2}>2. זכאות לשימוש</Text>
        <Text style={styles.p}>השימוש באתר מותר לכל גיל (בכפוף לדין). משתמשים מתחת לגיל 13 נדרשים לקבל אישור מאפוטרופוס חוקי. העסק שומר לעצמו את הזכות להשעות או לחסום גישה של משתמשים במקרה של חשד סביר להפרה יסודית של תנאי השימוש.</Text>
        <Text style={styles.p}><Text style={styles.bold}>שימוש אסור:</Text> העתקה, שכפול, הפצה, שיווק או שימוש מסחרי בתכנים המוצגים באתר ללא אישור מראש ובכתב. כמו כן, חל איסור על ביצוע פעולות אלימות, הטרדה, איומים, העלאת תוכן פוגע, או פגיעה בתפקודו התקין של האתר.</Text>

        <Text style={styles.h2}>3. מדיניות ביטולים והחזר כספי</Text>
        <Text style={styles.p}>כל בקשה לביטול עסקה תטופל בהתאם להוראות הדין, לרבות חוק הגנת הצרכן. החזר כספי יינתן בהתאם לתנאי החוק, ובניכוי דמי ביטול כדין במקרים שאינם נובעים מפגם.</Text>

        <Text style={styles.h2}>4. זמינות השירות</Text>
        <Text style={styles.p}>העסק עושה מאמצים סבירים להבטיח זמינות תקינה של המערכת, אך אין התחייבות לזמינות מוחלטת ללא תקלות.</Text>

        <Text style={styles.h2}>5. קניין רוחני ותוכן גולשים</Text>
        <Text style={styles.p}>כל זכויות הקניין הרוחני באתר, לרבות קוד מקור, סימני מסחר, לוגו, ובסיסי נתונים שייכות ל-WAVEZ PRO בלבד. חל איסור מוחלט לעשות שימוש בבוטים, עכבישים, או מערכות סריקה לשם כריית מידע או אימון מודלים של בינה מלאכותית ללא רשות מפורשת.</Text>

        <Text style={styles.h2}>6. הגבלת אחריות ושיפוי</Text>
        <Text style={styles.p}>השירות ניתן כפי שהוא (AS IS). העסק אינו מתחייב שהשירות יהיה חסין מוחלט מפני תקלות. המשתמש מצהיר ומתחייב כי הוא האחראי הבלעדי לכל שימוש לרעה באתר. המשתמש מתחייב לשפות את העסק בגין כל נזק או הוצאה סבירה שייגרמו לה עקב הפרה יסודית של תנאי השימוש על ידו.</Text>

        <Text style={styles.h2}>7. דין ושיפוט</Text>
        <Text style={styles.p}>על הסכם זה יחול הדין הישראלי בלבד. סמכות השיפוט הבלעדית בכל עניין הנובע מתנאים אלו תהיה נתונה לבית המשפט המוסמך במחוז תל אביב-יפו.</Text>
        <Text style={styles.p}>בעצם אישור תנאי שירות אלה, המשתמש מסכים במפורש לפתור כל מחלוקת באופן אינדיבידואלי בלבד, ומוותר על זכותו להשתתף בתובענה ייצוגית כנגד העסק.</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    padding: 10,
    width: 50,
  },
  backText: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  h1: {
    color: '#38bdf8',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  h2: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  p: {
    color: '#94a3b8',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  bold: {
    color: '#cbd5e1',
    fontWeight: 'bold',
  },
  date: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  bulletList: {
    marginBottom: 12,
  },
  li: {
    color: '#94a3b8',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  separator: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 30,
  },
});
