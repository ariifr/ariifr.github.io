        document.getElementById("cekKuotaForm").addEventListener("submit", async function(event) {
            event.preventDefault();
            
            const nomorInput = document.getElementById("nomor").value.trim();
            const loadingIndicator = document.getElementById("loadingIndicator");
            const resultsContainer = document.getElementById("results-container");
            const errorContainer = document.getElementById("error-message");
            const errorText = document.getElementById("error-text");
            const mainWrapper = document.getElementById("main-wrapper");

            // Reset UI
            loadingIndicator.classList.remove("hidden");
            resultsContainer.classList.add("hidden");
            errorContainer.classList.add("hidden");

            // Konfigurasi untuk API call
            const apiUrl = `https://apigw.kmsp-store.com/sidompul/v4/cek_kuota?msisdn=${nomorInput}&isJSON=true`;
            const headers = {
                'Authorization': 'Basic c2lkb21wdWxhcGk6YXBpZ3drbXNw',
                'X-API-Key': '60ef29aa-a648-4668-90ae-20951ef90c55',
                'X-App-Version': '4.0.0'
            };

            try {
                const response = await fetch(apiUrl, { headers: headers });
                const data = await response.json();

                if (response.ok && data.status === true) {
                    // Jika API call berhasil dan status true
                    displayData(data.data);
                    
                    // Ubah alignment ke atas dan tampilkan hasil
                    mainWrapper.classList.remove('items-center');
                    mainWrapper.classList.add('items-start');
                    resultsContainer.classList.remove("hidden");
                    
                    // Scroll ke container hasil
                    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

                } else {
                    // Jika API mengembalikan pesan error, tetap di tengah
                    mainWrapper.classList.add('items-center');
                    mainWrapper.classList.remove('items-start');
                    errorText.textContent = data.message || `Gagal memproses nomor ${nomorInput}.`;
                    errorContainer.classList.remove("hidden");
                }

            } catch (error) {
                // Jika terjadi error jaringan atau lainnya, tetap di tengah
                mainWrapper.classList.add('items-center');
                mainWrapper.classList.remove('items-start');
                console.error("Fetch error:", error);
                errorText.textContent = "Gagal terhubung ke server. Periksa koneksi internet Anda.";
                errorContainer.classList.remove("hidden");
            } finally {
                // Selalu sembunyikan loading indicator setelah selesai
                loadingIndicator.classList.add("hidden");
            }
        });
        
        // --- Fungsi untuk Menampilkan Data ---
        function displayData(data) {
            // Tampilkan MSISDN
            document.getElementById('msisdn-display').textContent = `MSISDN: ${data.msisdn}`;
            
            // Tampilkan Informasi Kartu
            const cardInfoContainer = document.getElementById('card-info-container');
            const sp = data.data_sp;
            cardInfoContainer.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="text-gray-500 dark:text-gray-400">📡 Operator</span>
                    <span class="font-semibold text-gray-900 dark:text-white">${sp.prefix.value}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-500 dark:text-gray-400">✅ Status Dukcapil</span>
                    <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">${sp.dukcapil.value}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-500 dark:text-gray-400">📶 Status Jaringan</span>
                    <span class="font-semibold text-gray-900 dark:text-white">${sp.status_4g.value}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-500 dark:text-gray-400">🎂 Umur Kartu</span>
                    <span class="font-semibold text-gray-900 dark:text-white">${sp.active_card.value}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-500 dark:text-gray-400">🗓️ Masa Aktif s/d</span>
                    <span class="font-semibold text-gray-900 dark:text-white">${formatSimpleDate(sp.active_period.value)}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-500 dark:text-gray-400">⏳ Masa Tenggang s/d</span>
                    <span class="font-semibold text-red-600 dark:text-red-400">${formatSimpleDate(sp.grace_period.value)}</span>
                </div>
            `;
            
            // Tampilkan Detail Kuota
            const quotaContainer = document.getElementById('quota-details-container');
            quotaContainer.innerHTML = ''; // Kosongkan dulu
            
            if (sp.quotas && sp.quotas.value && sp.quotas.value.length > 0) {
                sp.quotas.value.forEach(paketData => {
                    if (!paketData || !paketData[0]) return;
                    const paket = paketData[0]; // Ambil objek paket
                    let benefitsHtml = '<p class="text-sm text-gray-600 dark:text-gray-300 mt-2">Tidak ada rincian benefit pada paket ini.</p>';
                    
                    if (paket.benefits && paket.benefits.length > 0) {
                        benefitsHtml = '<ul class="space-y-4 text-sm">';
                        paket.benefits.forEach(benefit => {
                            if (benefit.type === 'DATA') {
                                const { percentage } = parseAndCalculateQuota(benefit.remaining, benefit.quota);
                                const progressBarColor = percentage > 50 ? 'bg-green-500' : percentage > 10 ? 'bg-yellow-500' : 'bg-red-500';
                                benefitsHtml += `
                                    <li>
                                        <div class="flex justify-between font-medium text-gray-300">
                                            <span>🌐 ${benefit.bname}</span>
                                            <span>${benefit.remaining} / ${benefit.quota}</span>
                                        </div>
                                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                                            <div class="${progressBarColor} h-2 rounded-full" style="width: ${percentage}%;"></div>
                                        </div>
                                    </li>
                                `;
                            } else { // Untuk VOICE, SMS, dll.
                                benefitsHtml += `
                                    <li>
                                        <div class="flex justify-between font-medium text-indigo-600 dark:text-indigo-400">
                                            <span>📞 ${benefit.bname}</span>
                                            <span>${benefit.remaining}</span>
                                        </div>
                                    </li>
                                `;
                            }
                        });
                        benefitsHtml += '</ul>';
                    }
                    
                    quotaContainer.innerHTML += `
                        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div class="mb-3">
                                <h3 class="font-bold text-lg text-blue-600 dark:text-blue-400">${paket.packages.name}</h3>
                                <p class="text-xs text-gray-500 dark:text-gray-400">Kadaluarsa: ${formatFullDate(paket.packages.expDate)}</p>
                            </div>
                            ${benefitsHtml}
                        </div>
                    `;
                });
            } else {
                 quotaContainer.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400">Tidak ada data paket kuota yang ditemukan.</p>';
            }
        }
        
        // --- Helper Functions ---
        function formatSimpleDate(dateStr) {
            if (!dateStr) return 'N/A';
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(dateStr).toLocaleDateString('id-ID', options);
        }
        
        function formatFullDate(dateStr) {
            if (!dateStr) return 'N/A';
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            return new Date(dateStr).toLocaleDateString('id-ID', options).replace(/\./g, ':');
        }

        function parseAndCalculateQuota(remainingStr, totalStr) {
            const parseValue = (str) => {
                if (!str) return 0;
                let value = parseFloat(str.replace(/,/g, '.'));
                if (str.toLowerCase().includes('gb')) value *= 1024; // Convert GB to MB for comparison
                return isNaN(value) ? 0 : value;
            };

            let remaining = parseValue(remainingStr);
            let total = parseValue(totalStr);
            if (total === 0) return { remaining, total, percentage: 0 };
            
            let percentage = (remaining / total) * 100;
            return { remaining, total, percentage: Math.min(percentage, 100) }; // Cap at 100%
        }