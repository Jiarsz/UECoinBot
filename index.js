const axios = require('axios');
const fs = require('fs');

function displayTitle() {
    const title = "UECoin Auto Claim BOT"; 
    const borderLength = title.length + 4;
    const border = ''.padEnd(borderLength, '=') + '';

    const formattedTitle = ` ${title} `;
    
    console.log(border);
    console.log(formattedTitle);
    
    console.log(border);
}

displayTitle();

async function login(initData, accountNumber) {
    const payloadLogin = {
        init_data: initData,
        referrer: ''
    };

    const urlLogin = 'https://zejlgz.com/api/login/tg';
    try {
        const response = await axios.post(urlLogin, payloadLogin);
        const dataLogin = response.data;
        if (dataLogin.code === 0 && dataLogin.data && dataLogin.data.token && dataLogin.data.token.token) {
            const token = dataLogin.data.token.token;
            console.log(`[Akun Ke-${accountNumber}] Berhasil login akun`);
            return token;
        } else {
            console.log(`[Akun Ke-${accountNumber}] Login Gagal: Token tidak ditemukan.`);
        }
    } catch (error) {
        console.log(`[Akun Ke-${accountNumber}] Permintaan Gagal dengan Status Kode: ${error.response ? error.response.status : 'Unknown'}`);
    }
    return null;
}

async function checkAssets(token, accountNumber) {
    const payloadAssets = { token };
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'Origin': 'https://ueex-mining-be9.pages.dev',
        'Pragma': 'no-cache',
        'Referer': 'https://ueex-mining-be9.pages.dev/',
        'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, seperti Gecko) Chrome/126.0.0.0 Safari/537.36'
    };
    const urlAssets = 'https://zejlgz.com/api/user/assets';

    try {
        const response = await axios.post(urlAssets, payloadAssets, { headers });
        const dataAssets = response.data;
        if (dataAssets.code === 0) {
            const ueAmount = dataAssets.data.ue ? dataAssets.data.ue.amount : 0;
            const usdtAmount = dataAssets.data.usdt ? dataAssets.data.usdt.amount : 0;
            const diamondAmount = dataAssets.data.diamond ? dataAssets.data.diamond.amount : 0;

            return { ueAmount, usdtAmount, diamondAmount };
        } else {
            console.log(`[Akun Ke-${accountNumber}] Gagal mendapatkan data aset: ${dataAssets.message || 'Tidak diketahui'}`);
        }
    } catch (error) {
        console.log(`[Akun Ke-${accountNumber}] Permintaan Gagal dengan Status Kode: ${error.response ? error.response.status : 'Unknown'}`);
    }
    return { ueAmount: null, usdtAmount: null, diamondAmount: null };
}

async function checkDrops(token, accountNumber) {
    const payloadSceneInfo = { token };
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
    };
    const urlSceneInfo = 'https://zejlgz.com/api/scene/info';

    try {
        const response = await axios.post(urlSceneInfo, payloadSceneInfo, { headers });
        const dataSceneInfo = response.data;
        if (dataSceneInfo.code === 0) {
            let rewardClaimed = false;
            for (const scene of dataSceneInfo.data) {
                if (scene.eggs) {
                    for (const egg of scene.eggs) {
                        if (egg.flag === 0) {
                            await claimDrop(token, egg, accountNumber);
                            rewardClaimed = true;
                        }
                    }
                }
            }
            return rewardClaimed; // Return status of reward claimed
        } else {
            console.log(`[Akun Ke-${accountNumber}] Gagal mendapatkan data scene info: ${dataSceneInfo.message || 'Tidak diketahui'}`);
        }
    } catch (error) {
        console.log(`[Akun Ke-${accountNumber}] Permintaan Gagal dengan Status Kode: ${error.response ? error.response.status : 'Unknown'}`);
    }
    return false;
}

async function claimDrop(token, egg, accountNumber) {
    const payloadEggReward = {
        token,
        egg_uid: egg.uid
    };
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
    };
    const urlEggReward = 'https://zejlgz.com/api/scene/egg/reward';

    try {
        const response = await axios.post(urlEggReward, payloadEggReward, { headers });
        const dataEggReward = response.data;
        if (dataEggReward.code === 0) {
            if (egg.a_type === 'ue') {
                console.log(`Success collect UECoin ${egg.amount}`);
            } else if (egg.a_type === 'usdt') {
                console.log(`Success collect USDT ${egg.amount}`);
            }
        } else {
            console.log(`[Akun Ke-${accountNumber}] Gagal mengklaim egg reward: ${dataEggReward.message || 'Tidak diketahui'}`);
        }
    } catch (error) {
        console.log(`[Akun Ke-${accountNumber}] Permintaan Gagal dengan Status Kode: ${error.response ? error.response.status : 'Unknown'}`);
        console.log("Response text:", error.response ? error.response.data : 'Unknown error');
    }
}

async function displayCountdown(minutes) {
    let seconds = minutes * 60;

    return new Promise(resolve => {
        const interval = setInterval(() => {
            const min = Math.floor(seconds / 60);
            const sec = seconds % 60;
            process.stdout.clearLine(); // Clear the current line
            process.stdout.cursorTo(0); // Move cursor to the beginning of the line
            process.stdout.write(`==========Menunggu ${min}:${sec < 10 ? '0' : ''}${sec} sebelum melakukan claim berikutnya==========`);
            seconds--;

            if (seconds < 0) {
                clearInterval(interval);
                process.stdout.write(`\n`);
                resolve();
            }
        }, 1000);
    });
}

async function processAccount(initData, accountNumber) {
    let token = await login(initData, accountNumber);
    if (!token) return;  // Jika login gagal, hentikan eksekusi

    // Klaim semua hadiah yang tersedia
    let rewardClaimed = await checkDrops(token, accountNumber);

    // Tampilkan saldo terbaru setelah klaim
    if (rewardClaimed) {
        const { ueAmount, usdtAmount, diamondAmount } = await checkAssets(token, accountNumber);  // Dapatkan saldo terbaru
        console.log('[Saldo Terbaru]' + 
                    ` UE: ${ueAmount}` + ' | ' + 
                    `USDT: ${usdtAmount}` + ' | ' + 
                    `Diamond: ${diamondAmount}`);
    } else {
        console.log(`[Akun Ke-${accountNumber}] Waiting For Reward...`);
    }
}

async function main() {
    fs.readFile('akun.txt', 'utf8', async (err, data) => {
        if (err) {
            console.error('Gagal membaca file akun.txt:', err);
            return;
        }
        const accounts = data.split('\n').filter(account => account.trim());
        while (true) {
            for (let i = 0; i < accounts.length; i++) {
                await processAccount(accounts[i].trim(), i + 1);
            }
            // Menunggu sebelum melakukan klaim berikutnya untuk semua akun
            await displayCountdown(10);
        }
    });
}

main();
