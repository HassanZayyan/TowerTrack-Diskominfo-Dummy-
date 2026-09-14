<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        {{-- public/favicon.ico was a 0-byte file, so every page served an empty
             icon that browsers fell back from. Both are now generated from the
             regency crest, rebuildable with:
             python scripts/optimize-images.py --icons path/to/crest.png --}}
        <link rel="icon" href="{{ asset('favicon.ico') }}" sizes="any">
        <link rel="apple-touch-icon" href="{{ asset('images/apple-touch-icon.png') }}">

        <!-- DNS Prefetch for external resources -->
        <link rel="dns-prefetch" href="https://fonts.bunny.net">
        <link rel="dns-prefetch" href="https://tile.openstreetmap.org">
        
        <!-- Preconnect for faster font loading -->
        <link rel="preconnect" href="https://fonts.bunny.net" crossorigin>
        
        {{-- Weight 700 added: the codebase uses font-bold/font-extrabold in 188
             places, and without a real 700 face every one of them was rendered
             as browser-synthesised faux bold — smeared strokes, wrong metrics. --}}
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600,700&display=swap" rel="stylesheet" />

        {{-- Pin the light theme until the dark surfaces actually ship. Without
             this, a browser forced to dark half-inverts native form controls
             while the app's own surfaces stay light. --}}
        <meta name="color-scheme" content="light">
        {{-- #800000, Semarang Maroon. Was #1D4ED8 — Meridian Blue, the palette
             that was planned and then not adopted. Android Chrome paints its
             own toolbar with this, so the wrong value meant every phone framed
             a maroon app in blue. --}}
        <meta name="theme-color" content="#800000">

        {{-- No hero preload any more, because there is no hero image any more.

             /data-tower and /data-fo used to open with a cartoon illustration —
             773KB and 1.3MB of PNG, 100KB and 120KB once converted to WebP.
             Both are now drawn as inline SVG from the design tokens
             (Components/HeroIsoArt.tsx), which arrives with the page markup and
             has nothing to preload. public/images went from 2.7MB to 40KB, and
             all that is left in it is the regency crest and the home-screen
             icon. --}}

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
