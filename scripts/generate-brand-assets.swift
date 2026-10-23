// Genera los iconos y el splash de MEEET a partir del imagotipo (dos círculos
// que se encuentran: lavanda y melocotón, con el cruce en violeta) y la marca.
// Uso (macOS): swift scripts/generate-brand-assets.swift
//
// Los colores y la geometría deben coincidir con src/theme.ts y
// src/components/imagotipo.tsx.

import AppKit

func hex(_ value: Int) -> NSColor {
  NSColor(
    srgbRed: CGFloat((value >> 16) & 0xFF) / 255, green: CGFloat((value >> 8) & 0xFF) / 255,
    blue: CGFloat(value & 0xFF) / 255, alpha: 1)
}

let accent = hex(0x8F78F5)
let lavender = hex(0xC7B8FF)
let peach = hex(0xFFCFC2)
// Escala del salmón para las "eee" del logotipo (COLORS.peachMid / peachDeep)
let peachMid = hex(0xFFAE98)
let peachDeep = hex(0xF98B6F)
let ink = hex(0x2A2540)
let white = NSColor.white

let out = URL(fileURLWithPath: CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "assets/images")

// Geometría del imagotipo en unidades del radio R (la misma que imagotipo.tsx):
// el círculo melocotón está arriba a la derecha del lavanda
let OFFSET_X: CGFloat = 0.705
let OFFSET_Y: CGFloat = 0.41
let MARK_W: CGFloat = 2 + OFFSET_X
let MARK_H: CGFloat = 2 + OFFSET_Y

struct MarkColors {
  var left: NSColor
  var right: NSColor
  var cross: NSColor
}

/// Dibuja el imagotipo de alto `height` con su esquina superior izquierda en `origin` (y hacia abajo).
func drawMark(_ ctx: CGContext, origin: CGPoint, height: CGFloat, colors: MarkColors, evenOdd: Bool = false) {
  let r = height / MARK_H
  // CoreGraphics tiene el origen abajo: se convierte desde arriba-izquierda
  let left = CGRect(x: origin.x, y: origin.y - height, width: 2 * r, height: 2 * r)
  let right = CGRect(x: origin.x + OFFSET_X * r, y: origin.y - 2 * r, width: 2 * r, height: 2 * r)
  if evenOdd {
    // Monocromo: los dos círculos con el cruce hueco
    ctx.setFillColor(colors.left.cgColor)
    ctx.addEllipse(in: left)
    ctx.addEllipse(in: right)
    ctx.drawPath(using: .eoFill)
    return
  }
  ctx.setFillColor(colors.right.cgColor)
  ctx.fillEllipse(in: right)
  ctx.setFillColor(colors.left.cgColor)
  ctx.fillEllipse(in: left)
  ctx.saveGState()
  ctx.addEllipse(in: left)
  ctx.clip()
  ctx.setFillColor(colors.cross.cgColor)
  ctx.fillEllipse(in: right)
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

/// Imagotipo centrado en un lienzo cuadrado, ocupando `share` de su ancho.
func centeredMark(side: Int, share: CGFloat, colors: MarkColors, evenOdd: Bool = false) -> (CGContext) -> Void {
  { ctx in
    let w = CGFloat(side) * share
    let h = w * MARK_H / MARK_W
    let origin = CGPoint(x: (CGFloat(side) - w) / 2, y: (CGFloat(side) + h) / 2)
    drawMark(ctx, origin: origin, height: h, colors: colors, evenOdd: evenOdd)
  }
}

// Variante "Lavanda" de la hoja de marca: círculo blanco y melocotón sobre lavanda
let iconColors = MarkColors(left: white, right: peach, cross: accent)

// Icono de la app (iOS recorta las esquinas)
render("icon.png", width: 1024, height: 1024, background: lavender,
       draw: centeredMark(side: 1024, share: 0.62, colors: iconColors))

// Favicon web
render("favicon.png", width: 48, height: 48, background: lavender,
       draw: centeredMark(side: 48, share: 0.7, colors: iconColors))

// Android adaptativo: el sistema recorta a ~66 % del centro, el imagotipo cabe ahí
render("android-icon-background.png", width: 512, height: 512, background: lavender) { _ in }
render("android-icon-foreground.png", width: 512, height: 512,
       draw: centeredMark(side: 512, share: 0.42, colors: iconColors))
// Monocromo (Android 13+ lo tiñe): solo cuenta el alfa
render("android-icon-monochrome.png", width: 432, height: 432,
       draw: centeredMark(side: 432, share: 0.5, colors: MarkColors(left: white, right: white, cross: white), evenOdd: true))

// Splash: imagotipo + "meeet." sobre transparente (el fondo lo pone app.json).
// Proporción 3:1, la que usa src/components/splash-overlay.tsx
render("splash-icon.png", width: 600, height: 200) { ctx in
  let fontSize: CGFloat = 104
  let font = NSFont.systemFont(ofSize: fontSize, weight: .semibold)
  let text = NSMutableAttributedString()
  for (letter, color) in [("m", ink), ("e", peach), ("e", peachMid), ("e", peachDeep), ("t", ink), (".", accent)] {
    text.append(NSAttributedString(
      string: letter, attributes: [.font: font, .foregroundColor: color, .kern: -fontSize * 0.03]))
  }
  let glyphs = text.boundingRect(with: .zero, options: [.usesDeviceMetrics])

  let markH = fontSize * 1.14
  let markW = markH * MARK_W / MARK_H
  let gap = fontSize * 0.37
  let total = markW + gap + glyphs.width
  let x = (600 - total) / 2
  // El imagotipo centrado en vertical con el ojo medio de las letras
  let baseline = (200 - glyphs.height) / 2 - glyphs.minY
  let xMid = baseline + font.xHeight / 2
  drawMark(ctx, origin: CGPoint(x: x, y: xMid + markH / 2), height: markH,
           colors: MarkColors(left: lavender, right: peach, cross: accent))

  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = NSGraphicsContext(cgContext: ctx, flipped: false)
  text.draw(with: NSRect(x: x + markW + gap - glyphs.minX, y: baseline, width: 0, height: 0), options: [])
  NSGraphicsContext.restoreGraphicsState()
}
