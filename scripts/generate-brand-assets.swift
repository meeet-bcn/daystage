// Genera los iconos y el splash de MEEET a partir de la marca tipográfica.
// Uso (macOS): swift scripts/generate-brand-assets.swift
//
// Los colores deben coincidir con src/theme.ts. Son recursos provisionales
// hasta tener un logo diseñado: basta con sustituir los PNG en assets/images/.

import AppKit

let accent = NSColor(srgbRed: 0x7B / 255, green: 0x5C / 255, blue: 0xFA / 255, alpha: 1)
let peach = NSColor(srgbRed: 0xFF / 255, green: 0xC9 / 255, blue: 0xA8 / 255, alpha: 1)
let white = NSColor.white

let out = URL(fileURLWithPath: CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "assets/images")

/// Texto en dos colores: la marca y su punto final.
func mark(_ text: String, color: NSColor, dot: NSColor, size: CGFloat) -> NSAttributedString {
  let font = NSFont.systemFont(ofSize: size, weight: .heavy)
  let kern = -size * 0.03
  let result = NSMutableAttributedString(
    string: text, attributes: [.font: font, .foregroundColor: color, .kern: kern])
  result.append(NSAttributedString(string: ".", attributes: [.font: font, .foregroundColor: dot]))
  return result
}

/// Dibuja `text` centrado ópticamente (por la caja real de los glifos) en un PNG.
func render(
  _ name: String, width: Int, height: Int, background: NSColor? = nil, text: NSAttributedString
) {
  let rep = NSBitmapImageRep(
    bitmapDataPlanes: nil, pixelsWide: width, pixelsHigh: height, bitsPerSample: 8,
    samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB,
    bytesPerRow: 0, bitsPerPixel: 0)!
  rep.size = NSSize(width: width, height: height)  // 1 punto = 1 píxel

  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)

  if let background {
    background.setFill()
    NSRect(x: 0, y: 0, width: width, height: height).fill()
  }

  // Sin .usesLineFragmentOrigin, la caja se mide y se dibuja desde la línea base
  let glyphs = text.boundingRect(with: .zero, options: [.usesDeviceMetrics])
  let origin = NSPoint(
    x: (CGFloat(width) - glyphs.width) / 2 - glyphs.minX,
    y: (CGFloat(height) - glyphs.height) / 2 - glyphs.minY)
  text.draw(with: NSRect(origin: origin, size: .zero), options: [])

  NSGraphicsContext.restoreGraphicsState()

  let url = out.appendingPathComponent(name)
  try! rep.representation(using: .png, properties: [:])!.write(to: url)
  print("✓ \(name) \(width)×\(height)")
}

// Icono de la app (iOS recorta las esquinas): monograma blanco sobre violeta
render("icon.png", width: 1024, height: 1024, background: accent,
       text: mark("m", color: white, dot: peach, size: 620))

// Favicon web
render("favicon.png", width: 48, height: 48, background: accent,
       text: mark("m", color: white, dot: peach, size: 30))

// Android adaptativo: el sistema recorta a ~66 % del centro, el glifo cabe ahí
render("android-icon-background.png", width: 512, height: 512, background: accent,
       text: NSAttributedString(string: ""))
render("android-icon-foreground.png", width: 512, height: 512,
       text: mark("m", color: white, dot: peach, size: 230))
// Monocromo (Android 13+ lo tiñe): solo cuenta el alfa
render("android-icon-monochrome.png", width: 432, height: 432,
       text: mark("m", color: white, dot: white, size: 194))

// Splash: la marca completa en violeta sobre fondo transparente (el fondo lo pone app.json).
// Proporción 3:1, la que usa src/components/splash-overlay.tsx
render("splash-icon.png", width: 600, height: 200,
       text: mark("meeet", color: accent, dot: peach, size: 150))
