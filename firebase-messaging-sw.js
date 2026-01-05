<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إدارة طعم الشام - نظام الإشعارات</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
        body { font-family: 'Tajawal', sans-serif; background-color: #f3f4f6; }
        .notification-banner { @apply fixed top-4 left-4 right-4 bg-white p-4 rounded-2xl shadow-2xl border-r-4 border-red-600 z-[200] flex items-center gap-4 animate-bounce; }
    </style>
</head>
<body>

    <div id="setup-banner" class="bg-yellow-100 p-4 text-center text-sm font-bold text-yellow-800 hidden">
        يجب السماح بالإشعارات لتلقي تنبيهات الطلبات الجديدة 
        <button onclick="requestPermission()" class="bg-yellow-600 text-white px-3 py-1 rounded-lg mr-2">تفعيل الآن</button>
    </div>

    <div class="p-6 max-w-3xl mx-auto">
        <header class="flex justify-between items-center mb-8">
            <div>
                <h1 class="text-2xl font-black text-gray-800">طلبات المطبخ</h1>
                <p id="token-status" class="text-[10px] text-gray-400">جاري الاتصال بنظام FCM...</p>
            </div>
            <div class="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                متصل مباشرة
            </div>
        </header>

        <div id="admin-orders-container" class="space-y-4">
            <!-- الطلبات تظهر هنا -->
        </div>
    </div>

    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getFirestore, collection, onSnapshot, query, orderBy, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
        import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-messaging.js";

        const firebaseConfig = {
            apiKey: "AIzaSyCpP0TTGYb_n2zuVZKGh2WgNK0cqJVBfb0",
            authDomain: "taste-of-sham-cccd0.firebaseapp.com",
            projectId: "taste-of-sham-cccd0",
            storageBucket: "taste-of-sham-cccd0.firebasestorage.app",
            messagingSenderId: "885507234556",
            appId: "1:885507234556:web:a18a286a11952f23189579"
        };

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        const messaging = getMessaging(app);
        const vapidKey = "BArTO7yPr2CyD2i8ph81yd8vcOdTqboMMDESL74micrvUAUWPYIhyEqhvs8RezpcmggW0IhtfmZRhjooQPdv-ck";

        // --- نظام إشعارات FCM ---

        async function requestPermission() {
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    const token = await getToken(messaging, { vapidKey });
                    if (token) {
                        console.log("FCM Token:", token);
                        document.getElementById('token-status').innerText = "تم تفعيل الإشعارات بنجاح";
                        document.getElementById('setup-banner').classList.add('hidden');
                        // هنا يمكنك حفظ التوكن في Firestore لترسل له من السيرفر
                    }
                } else {
                    document.getElementById('token-status').innerText = "تم رفض إذن الإشعارات";
                }
            } catch (err) {
                console.error("Error setting up FCM:", err);
            }
        }

        // الاستماع للرسائل والصفحة مفتوحة
        onMessage(messaging, (payload) => {
            console.log('Message received. ', payload);
            new Notification(payload.notification.title, {
                body: payload.notification.body,
                icon: '/icon.png'
            });
        });

        // تحقق من الإذن عند التشغيل
        if (Notification.permission !== 'granted') {
            document.getElementById('setup-banner').classList.remove('hidden');
        } else {
            requestPermission();
        }

        // --- جلب الطلبات من Firestore ---
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        onSnapshot(q, (snapshot) => {
            const container = document.getElementById('admin-orders-container');
            container.innerHTML = "";
            
            snapshot.forEach((doc) => {
                const order = doc.data();
                const card = document.createElement('div');
                card.className = `bg-white p-6 rounded-3xl shadow-sm border-r-8 ${order.status === 'pending' ? 'border-yellow-400' : 'border-green-500'}`;
                card.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-[10px] font-bold text-gray-400">طاولة ${order.table}</p>
                            <h3 class="font-black text-lg">${order.userEmail.split('@')[0]}</h3>
                        </div>
                        <span class="font-black text-red-600">${order.totalSAR} ر.س</span>
                    </div>
                    <div class="mt-4 text-sm text-gray-600">
                        ${order.items.map(i => `<div>- ${i.name} (x${i.qty})</div>`).join('')}
                    </div>
                    ${order.status === 'pending' ? 
                        `<button onclick="completeOrder('${doc.id}')" class="w-full mt-4 bg-green-600 text-white py-3 rounded-xl font-bold">إكمال الطلب</button>` : 
                        `<p class="mt-4 text-center text-green-600 font-bold text-xs italic">تم التجهيز ✓</p>`
                    }
                `;
                container.appendChild(card);
            });
        });

        window.completeOrder = async (id) => {
            await updateDoc(doc(db, "orders", id), { status: 'completed' });
        };

        window.requestPermission = requestPermission;
        lucide.createIcons();
    </script>
</body>
</html>

