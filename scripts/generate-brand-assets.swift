// Genera los iconos y el splash de DayStage a partir del imagotipo (hoja de
// calendario con el degradado de escenario, dos anillas y dos corcheas unidas (♫)).
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

// Degradado de escenario (COLORS.stageViolet/stageMagenta/stageOrange)
let stage = [hex(0x7C5CFA), hex(0xD946A8), hex(0xFF8A3D)]
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
// Dos corcheas unidas por una barra (♫), dibujo propio. Unidades del lado de la
// hoja, con la y hacia abajo: cabezas ovaladas inclinadas (la izquierda más baja),
// plicas finas desde su lado derecho hacia arriba y una barra recta que sube
let NOTE_DX: CGFloat = 0.02 // para centrar el conjunto en la hoja
let HEADS: [CGPoint] = [CGPoint(x: 0.33, y: 0.70), CGPoint(x: 0.63, y: 0.62)]
let HEAD_W: CGFloat = 0.2
let HEAD_H: CGFloat = 0.135
let HEAD_ANGLE: CGFloat = -25
let STEM_W: CGFloat = 0.05
let STEM_RIGHT: CGFloat = 0.086 // borde derecho de la plica, desde el centro de su cabeza
let STEM_TOPS: [CGFloat] = [0.27, 0.19]
let BEAM_H: CGFloat = 0.08

/// Las dos corcheas como un solo trazado, en unidades de la hoja.
func notePath() -> CGPath {
  let path = CGMutablePath()
  for (i, head) in HEADS.enumerated() {
    let c = CGPoint(x: head.x + NOTE_DX, y: head.y)
    let t = CGAffineTransform(translationX: c.x, y: c.y).rotated(by: HEAD_ANGLE * .pi / 180)
    path.addEllipse(in: CGRect(x: -HEAD_W / 2, y: -HEAD_H / 2, width: HEAD_W, height: HEAD_H), transform: t)
    let right = c.x + STEM_RIGHT
    // La plica nace dentro de la barra, para que no asome por encima de su borde inclinado
    let top = STEM_TOPS[i] + BEAM_H / 2
    path.addRect(CGRect(x: right - STEM_W, y: top, width: STEM_W, height: c.y - top))
  }
  let left = HEADS[0].x + NOTE_DX + STEM_RIGHT - STEM_W
  let right = HEADS[1].x + NOTE_DX + STEM_RIGHT
  path.move(to: CGPoint(x: left, y: STEM_TOPS[0]))
  path.addLine(to: CGPoint(x: right, y: STEM_TOPS[1]))
  path.addLine(to: CGPoint(x: right, y: STEM_TOPS[1] + BEAM_H))
  path.addLine(to: CGPoint(x: left, y: STEM_TOPS[0] + BEAM_H))
  path.closeSubpath()
  return path
}

/// Alto total / lado (las anillas asoman por arriba).
let MARK_H: CGFloat = 1 - RING_TOP

struct MarkColors {
  /// Degradado de la hoja a 135° (de arriba a la izquierda a abajo a la derecha); un solo color = plano
  var sheet: [NSColor]
  var note: NSColor
  var rings: NSColor
}

/// Rellena `rect` con el degradado a 135° (en coordenadas con y hacia abajo).
func fillGradient(_ ctx: CGContext, _ colors: [NSColor], in rect: CGRect) {
  if colors.count == 1 {
    ctx.setFillColor(colors[0].cgColor)
    ctx.fill(rect)
    return
  }
  let locations = colors.indices.map { CGFloat($0) / CGFloat(colors.count - 1) }
  let gradient = CGGradient(
    colorsSpace: CGColorSpace(name: CGColorSpace.sRGB)!, colors: colors.map(\.cgColor) as CFArray,
    locations: locations)!
  ctx.drawLinearGradient(
    gradient, start: CGPoint(x: rect.minX, y: rect.minY), end: CGPoint(x: rect.maxX, y: rect.maxY), options: [])
}

/// Dibuja el imagotipo de lado `u` con su esquina superior izquierda (anillas incluidas) en `origin` (y hacia abajo).
func drawMark(_ ctx: CGContext, origin: CGPoint, side u: CGFloat, colors: MarkColors) {
  ctx.saveGState()
  ctx.translateBy(x: origin.x, y: origin.y)
  ctx.scaleBy(x: 1, y: -1)
  let top = -RING_TOP * u
  let sheet = CGRect(x: 0, y: top, width: u, height: u)
  ctx.saveGState()
  ctx.addPath(CGPath(roundedRect: sheet, cornerWidth: RADIUS * u, cornerHeight: RADIUS * u, transform: nil))
  ctx.clip()
  fillGradient(ctx, colors.sheet, in: sheet)
  ctx.restoreGState()

  // Las corcheas
  ctx.saveGState()
  ctx.translateBy(x: 0, y: top)
  ctx.scaleBy(x: u, y: u)
  ctx.addPath(notePath())
  ctx.setFillColor(colors.note.cgColor)
  ctx.fillPath(using: .winding)
  ctx.restoreGState()

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

let colors = MarkColors(sheet: stage, note: white, rings: ink)

// Icono de la app (iOS recorta las esquinas): el imagotipo sobre el lavanda casi blanco
render("icon.png", width: 1024, height: 1024, background: mist,
       draw: centeredMark(side: 1024, share: 0.62, colors: colors))

// El imagotipo para la app (DayStageMark lo pinta como imagen): transparente, 512 de lado de la hoja
render("brand-mark.png", width: 512, height: Int((512 * MARK_H).rounded())) { ctx in
  drawMark(ctx, origin: CGPoint(x: 0, y: (512 * MARK_H).rounded()), side: 512, colors: colors)
}

// Favicon web
render("favicon.png", width: 48, height: 48, background: mist,
       draw: centeredMark(side: 48, share: 0.8, colors: colors))

// Android adaptativo: el sistema recorta a ~66 % del centro, el imagotipo cabe ahí
render("android-icon-background.png", width: 512, height: 512, background: mist) { _ in }
render("android-icon-foreground.png", width: 512, height: 512,
       draw: centeredMark(side: 512, share: 0.44, colors: colors))
// Monocromo (Android 13+ lo tiñe): solo cuenta el alfa; las corcheas quedan huecas
render("android-icon-monochrome.png", width: 432, height: 432) { ctx in
  let mono = MarkColors(sheet: [white], note: .clear, rings: white)
  centeredMark(side: 432, share: 0.5, colors: mono)(ctx)
}

// Splash: imagotipo + "daystage." sobre transparente (el fondo lo pone app.json).
// Proporción 3:1, la que usa src/components/splash-overlay.tsx
render("splash-icon.png", width: 600, height: 200) { ctx in
  let fontSize: CGFloat = 92
  let font = NSFont.systemFont(ofSize: fontSize, weight: .heavy)
  let text = NSMutableAttributedString(
    string: "daystage", attributes: [.font: font, .foregroundColor: ink, .kern: -fontSize * 0.03])
  let glyphs = text.boundingRect(with: .zero, options: [.usesDeviceMetrics])

  let markH = fontSize * 1.15
  let u = markH / MARK_H
  let gap = fontSize * 0.3
  let total = u + gap + glyphs.width + fontSize * 0.24
  let x = (600 - total) / 2
  let baseline = (200 - glyphs.height) / 2 - glyphs.minY
  let xMid = baseline + font.xHeight / 2
  drawMark(ctx, origin: CGPoint(x: x, y: xMid + markH / 2), side: u, colors: colors)

  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = NSGraphicsContext(cgContext: ctx, flipped: false)
  text.draw(with: NSRect(x: x + u + gap - glyphs.minX, y: baseline, width: 0, height: 0), options: [])
  NSGraphicsContext.restoreGraphicsState()
  // El punto, con el degradado de la marca
  let dot = CGRect(x: x + u + gap + glyphs.width + fontSize * 0.04, y: baseline, width: fontSize * 0.2, height: fontSize * 0.2)
  ctx.saveGState()
  ctx.addEllipse(in: dot)
  ctx.clip()
  ctx.translateBy(x: 0, y: dot.minY + dot.maxY)
  ctx.scaleBy(x: 1, y: -1)
  fillGradient(ctx, stage, in: dot)
  ctx.restoreGState()
}

// Variantes de color para comparar (solo si se pide: swift … <carpeta> variantes)
if CommandLine.arguments.count > 2 {
  let variants: [(String, [NSColor])] = [
    ("variante-escenario.png", stage),
    ("variante-neon.png", [hex(0x4F6BFF), hex(0xA64DF5), hex(0xFF5FA2)]),
    ("variante-atardecer.png", [hex(0xFF5E7E), hex(0xFF8A3D), hex(0xFFC53D)]),
  ]
  for (name, sheet) in variants {
    render(name, width: 512, height: 512, background: mist,
           draw: centeredMark(side: 512, share: 0.62, colors: MarkColors(sheet: sheet, note: white, rings: ink)))
  }
}
