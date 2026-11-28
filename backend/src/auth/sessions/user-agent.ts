// Простой разбор User-Agent без библиотек: «Chrome on Windows», «Safari on iPhone».
// Порядок проверок важен: строка Edge содержит и «Chrome», и «Safari», а Chrome — «Safari».

const BROWSERS: [RegExp, string][] = [
    [/Edg(e|A|iOS)?\//, 'Edge'],
    [/OPR\/|Opera/, 'Opera'],
    [/SamsungBrowser\//, 'Samsung Internet'],
    [/YaBrowser\//, 'Yandex Browser'],
    [/Firefox\/|FxiOS\//, 'Firefox'],
    [/Chrome\/|CriOS\//, 'Chrome'],
    [/Version\/.*Safari\//, 'Safari'],
];

const SYSTEMS: [RegExp, string][] = [
    [/iPhone/, 'iPhone'],
    [/iPad/, 'iPad'],
    [/Android/, 'Android'],
    [/Windows/, 'Windows'],
    [/CrOS/, 'ChromeOS'],
    [/Mac OS X|Macintosh/, 'macOS'],
    [/Linux/, 'Linux'],
];

export type DeviceKind = 'mobile' | 'desktop';

export function describeUserAgent(userAgent: string | null): { device: string; kind: DeviceKind } {
    const ua = userAgent ?? '';
    const browser = BROWSERS.find(([re]) => re.test(ua))?.[1];
    const os = SYSTEMS.find(([re]) => re.test(ua))?.[1];

    const device =
        browser && os ? `${browser} on ${os}` : browser ?? os ?? 'Unknown device';
    const kind: DeviceKind = /Mobi|iPhone|iPad|Android/.test(ua) ? 'mobile' : 'desktop';

    return { device, kind };
}
