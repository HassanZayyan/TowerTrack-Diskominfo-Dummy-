<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifikasi Email</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 8px;
            border: 1px solid #ddd;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1e40af;
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .content {
            background-color: white;
            padding: 25px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .content p {
            color: #1f2937;
            margin-bottom: 15px;
        }
        .button {
            display: inline-block;
            padding: 14px 35px;
            background-color: #dc2626;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            text-align: center;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
        }
        .button:hover {
            background-color: #b91c1c;
            box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);
        }
        .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 30px;
        }
        .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .link {
            word-break: break-all;
            color: #1e40af;
            font-weight: 500;
            background-color: #eff6ff;
            padding: 10px;
            border-radius: 4px;
            display: block;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Verifikasi Email</h1>
        </div>
        
        <div class="content">
            <p>Halo,</p>
            
            <p>Terima kasih telah mengirim {{ $messageType === 'complaint' ? 'keluhan' : 'masukan' }} Anda. Untuk melindungi keamanan dan memastikan bahwa email yang Anda berikan valid, silakan verifikasi email Anda dengan mengklik tombol di bawah ini:</p>
            
            <div style="text-align: center;">
                <a href="{{ $verificationUrl }}" class="button">Verifikasi Email</a>
            </div>
            
            <p>Atau salin dan tempel link berikut di browser Anda:</p>
            <p class="link">{{ $verificationUrl }}</p>
            
            <div class="warning">
                <strong>⚠️ Penting:</strong> Link verifikasi ini akan kedaluwarsa dalam 24 jam. Jika Anda tidak mengklik link dalam waktu tersebut, Anda perlu meminta link verifikasi baru.
            </div>
            
            <p>Setelah email Anda terverifikasi, Anda akan dapat:</p>
            <ul>
                <li>Mengakses detail {{ $messageType === 'complaint' ? 'keluhan' : 'masukan' }} pribadi Anda</li>
                <li>Menerima notifikasi tentang status {{ $messageType === 'complaint' ? 'keluhan' : 'masukan' }} Anda</li>
                <li>Membalas balasan dari staff</li>
            </ul>
            
            <p>Jika Anda tidak mengirim {{ $messageType === 'complaint' ? 'keluhan' : 'masukan' }} ini, Anda dapat mengabaikan email ini.</p>
            
            <p>Salam,<br>Tim Tagging Tower Kominfo</p>
        </div>
        
        <div class="footer">
            <p>Email ini dikirim secara otomatis. Mohon jangan membalas email ini.</p>
            <p>&copy; {{ date('Y') }} Tagging Tower Kominfo. All rights reserved.</p>
        </div>
    </div>
</body>
</html>

