// Genera los iconos y el splash de DayStage a partir del imagotipo (hoja de
// calendario violeta con dos anillas y el haz de un foco sobre el escenario).
// Uso (macOS): swift scripts/generate-brand-assets.swift
//
// Los colores y la geometría deben coincidir con src/theme.ts y
// src/components/daystage-mark.tsx.

import AppKit

func hex(_ value: Int) -> NSColor {
  NSColor(
    srgbRed: CGFloat((value >> 16) & 0xFF) / 255, green: CGFloat((value >> 8) & 0xFF) / 255,
    blue: CGFloat(value & 0xFF) / 255, alpha: 1)
}

let accent = hex(0x8F78F5)
let lavender = hex(0xC7B8FF)
let mist = hex(0xFAF8FF)
let ink = hex(0x2A2540)
let white = NSColor.white

let out = URL(fileURLWithPath: CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "assets/images")


// Geometría en unidades del lado de la hoja (la misma que daystage-mark.tsx)
let RADIUS: CGFloat = 0.22
let RING_W: CGFloat = 0.09
let RING_H: CGFloat = 0.2
let RING_TOP: CGFloat = -0.08
let RINGS_X: [CGFloat] = [0.32, 0.68]
let BEAM_TOP: CGFloat = 0.3
let BEAM_BOTTOM: CGFloat = 0.74
let BEAM_TOP_W: CGFloat = 0.12
let BEAM_BOTTOM_W: CGFloat = 0.52
let STAGE_W: CGFloat = 0.56
let STAGE_H: CGFloat = 0.13
/// Alto total / lado (las anillas asoman por arriba).
let MARK_H: CGFloat = 1 - RING_TOP

struct MarkColors {
  var sheet: NSColor
  var light: NSColor
  var rings: NSColor
}

/// Dibuja el imagotipo de lado `u` con su esquina superior izquierda (anillas incluidas) en `origin` (y hacia abajo).
func drawMark(_ ctx: CGContext, origin: CGPoint, side u: CGFloat, colors: MarkColors) {
  ctx.saveGState()
  // Coordenadas con el origen arriba a la izquierda a partir de `origin`
  ctx.translateBy(x: origin.x, y: origin.y)
  ctx.scaleBy(x: 1, y: -1)
  let top = -RING_TOP * u
  let sheet = CGRect(x: 0, y: top, width: u, height: u)
  ctx.addPath(CGPath(roundedRect: sheet, cornerWidth: RADIUS * u, cornerHeight: RADIUS * u, transform: nil))
  ctx.setFillColor(colors.sheet.cgColor)
  ctx.fillPath()
  let beam = CGMutablePath()
  beam.move(to: CGPoint(x: (0.5 - BEAM_TOP_W / 2) * u, y: top + BEAM_TOP * u))
  beam.addLine(to: CGPoint(x: (0.5 + BEAM_TOP_W / 2) * u, y: top + BEAM_TOP * u))
  beam.addLine(to: CGPoint(x: (0.5 + BEAM_BOTTOM_W / 2) * u, y: top + BEAM_BOTTOM * u))
  beam.addLine(to: CGPoint(x: (0.5 - BEAM_BOTTOM_W / 2) * u, y: top + BEAM_BOTTOM * u))
  beam.closeSubpath()
  ctx.addPath(beam)
  ctx.setFillColor(colors.light.withAlphaComponent(0.9).cgColor)
  ctx.fillPath()
  ctx.setFillColor(colors.light.cgColor)
  ctx.fillEllipse(in: CGRect(x: (0.5 - STAGE_W / 2) * u, y: top + (BEAM_BOTTOM - STAGE_H / 2) * u, width: STAGE_W * u, height: STAGE_H * u))
  ctx.setFillColor(colors.rings.cgColor)
  for x in RINGS_X {
    let ring = CGRect(x: (x - RING_W / 2) * u, y: 0, width: RING_W * u, height: RING_H * u)
    ctx.addPath(CGPath(roundedRect: ring, cornerWidth: RING_W * u / 2, cornerHeight: RING_W * u / 2, transform: nil))
    ctx.fillPath()
  }
  ctx.restoreGState()
}

func render(_ name: String, width: Int, height: Int, background: NSColor? = nil, draw: (CGContext) -> Void) {
  let ctx = CGContext(
    data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 0,
    space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  if let background {
    ctx.setFillColor(background.cgColor)
    ctx.fill(CGRect(x: 0, y: 0, width: width, height: height))
  }
  draw(ctx)
  let rep = NSBitmapImageRep(cgImage: ctx.makeImage()!)
  try! rep.representation(using: .png, properties: [:])!.write(to: out.appendingPathComponent(name))
  print("✓ \(name) \(width)×\(height)")
}

/// Imagotipo centrado en un lienzo cuadrado: su alto total ocupa `share` del lienzo.
func centeredMark(side: Int, share: CGFloat, colors: MarkColors) -> (CGContext) -> Void {
  { ctx in
    let h = CGFloat(side) * share
    let u = h / MARK_H
    let origin = CGPoint(x: (CGFloat(side) - u) / 2, y: (CGFloat(side) + h) / 2)
    drawMark(ctx, origin: origin, side: u, colors: colors)
  }
}

let colors = MarkColors(sheet: accent, light: white, rings: ink)

// Icono de la app (iOS recorta las esquinas): el imagotipo sobre el lavanda casi blanco
render("icon.png", width: 1024, height: 1024, background: mist,
       draw: centeredMark(side: 1024, share: 0.62, colors: colors))

// Favicon web
render("favicon.png", width: 48, height: 48, background: mist,
       draw: centeredMark(side: 48, share: 0.8, colors: colors))

// Android adaptativo: el sistema recorta a ~66 % del centro, el imagotipo cabe ahí
render("android-icon-background.png", width: 512, height: 512, background: mist) { _ in }
render("android-icon-foreground.png", width: 512, height: 512,
       draw: centeredMark(side: 512, share: 0.44, colors: colors))
// Monocromo (Android 13+ lo tiñe): solo cuenta el alfa; el foco queda hueco
render("android-icon-monochrome.png", width: 432, height: 432) { ctx in
  let mono = MarkColors(sheet: white, light: .clear, rings: white)
  centeredMark(side: 432, share: 0.5, colors: mono)(ctx)
}

// Splash: imagotipo + "daystage." sobre transparente (el fondo lo pone app.json).
// Proporción 3:1, la que usa src/components/splash-overlay.tsx
render("splash-icon.png", width: 600, height: 200) { ctx in
  let fontSize: CGFloat = 92
  let font = NSFont.systemFont(ofSize: fontSize, weight: .heavy)
  let text = NSMutableAttributedString(
    string: "daystage", attributes: [.font: font, .foregroundColor: ink, .kern: -fontSize * 0.03])
  text.append(NSAttributedString(string: ".", attributes: [.font: font, .foregroundColor: accent]))
  let glyphs = text.boundingRect(with: .zero, options: [.usesDeviceMetrics])

  let markH = fontSize * 1.15
  let u = markH / MARK_H
  let gap = fontSize * 0.3
  let total = u + gap + glyphs.width
  let x = (600 - total) / 2
  let baseline = (200 - glyphs.height) / 2 - glyphs.minY
  let xMid = baseline + font.xHeight / 2
  drawMark(ctx, origin: CGPoint(x: x, y: xMid + markH / 2), side: u, colors: colors)

  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = NSGraphicsContext(cgContext: ctx, flipped: false)
  text.draw(with: NSRect(x: x + u + gap - glyphs.minX, y: baseline, width: 0, height: 0), options: [])
  NSGraphicsContext.restoreGraphicsState()
}
