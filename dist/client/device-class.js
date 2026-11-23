// Shared by the browser entry point and the hosted API worker.
function isClassroomHandheld({userAgent = '', platform = '', mobile = false, touchPoints = 0, formFactors = ''}) {
    if (mobile || /\b(?:mobile|tablet|phone)\b/i.test(String(formFactors))) return true;
    if (/android|ipados|\bios\b/i.test(platform)) return true;
    if (/Android|iPhone|iPod|iPad|Windows Phone|IEMobile|BlackBerry|Opera Mini|webOS|Silk\/|Kindle|PlayBook|\bTablet\b|\bMobile\b/i.test(userAgent)) return true;
    // iPadOS can send Safari's Mac UA. Touch alone also describes laptops.
    return touchPoints > 1 && (/Macintosh/i.test(userAgent) || /^Mac/i.test(platform));
}
