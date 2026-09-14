<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Balasan Admin</title>
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

        .response-box {
            background-color: #f3f4f6;
            border-left: 4px solid #1e40af;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }

        .response-box p {
            margin: 0;
            color: #374151;
            white-space: pre-wrap;
        }

        .button {
            display: inline-block;
            padding: 14px 35px;
            background-color: #1e40af;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            text-align: center;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 2px 4px rgba(30, 64, 175, 0.2);
        }

        .button:hover {
            background-color: #1e3a8a;
            color: #ffffff !important;
            box-shadow: 0 4px 6px rgba(30, 64, 175, 0.3);
        }

        .button:visited {
            color: #ffffff !important;
        }

        .button:link {
            color: #ffffff !important;
        }

        .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 30px;
        }

        .info {
            background-color: #dbeafe;
            border-left: 4px solid #3b82f6;
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
            <h1>Balasan Admin</h1>
        </div>

        <div class="content">
            <p>Halo {{ $senderName }},</p>

            <p>Admin telah membalas {{ $messageType === 'complaint' ? 'keluhan' : 'masukan' }} Anda. Berikut adalah
                balasan dari admin:</p>

            <div class="response-box">
                <p>{{ $response->message }}</p>
            </div>

            <div style="text-align: center;">
                <a href="{{ $viewUrl }}" class="button">Lihat Detail Balasan</a>
            </div>

            <p>Atau salin dan tempel link berikut di browser Anda:</p>
            <p class="link">{{ $viewUrl }}</p>

            <div class="info">
                <strong>ℹ️ Informasi:</strong> Anda dapat melihat semua balasan dan status
                {{ $messageType === 'complaint' ? 'keluhan' : 'masukan' }} Anda dengan mengklik link di atas.
            </div>

            <p>Jika Anda memiliki pertanyaan lebih lanjut, silakan balas melalui halaman detail
                {{ $messageType === 'complaint' ? 'keluhan' : 'masukan' }}.</p>

            <p>Salam,<br>Tim TowerTrack</p>
        </div>

        <div class="footer">
            <p>Email ini dikirim secara otomatis. Mohon jangan membalas email ini.</p>
            <p>&copy; {{ date('Y') }} TowerTrack. All rights reserved.</p>
        </div>
    </div>
</body>

</html>