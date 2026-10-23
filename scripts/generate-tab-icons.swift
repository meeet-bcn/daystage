// Iconos de la barra de pestañas que no existen como SF Symbol ni en Ionicons:
// la casa de Inicio (sin puerta) y el imagotipo de meeet in (dos círculos que
// se encuentran). Cada uno en versión normal (trazo) y seleccionada (relleno),
// a 1x, 2x y 3x. Son negros sobre transparente: la barra los tiñe (template).
//
// Uso: swift scripts/generate-tab-icons.swift

import AppKit

let SIZE: CGFloat = 26 // lado en pt, como los iconos del sistema en la barra
let STROKE: CGFloat = 1.8
let OUT_DIR = "assets/images/tabs"

func house(_ ctx: CGContext, filled: Bool) {
  let path = CGMutablePath()
  path.move(to: CGPoint(x: 13, y: 3.5))
  path.addLine(to: CGPoint(x: 22, y: 11))
  path.addLine(to: CGPoint(x: 22, y: 22.5))
  path.addLine(to: CGPoint(x: 4, y: 22.5))
  path.addLine(to: CGPoint(x: 4, y: 11))
  path.closeSubpath()
  ctx.addPath(path)
  ctx.setLineJoin(.round)
  ctx.setLineWidth(STROKE)
  // Relleno con el mismo trazo encima: así también redondea las esquinas
  ctx.drawPath(using: filled ? .fillStroke : .stroke)
}

func circles(_ ctx: CGContext, filled: Bool) {
  // La geometría del imagotipo (ver imagotipo.tsx): melocotón arriba a la derecha
  let r: CGFloat = 8.4
  let (dx, dy) = (0.705 * r, 0.41 * r)
  let width = 2 * r + dx, height = 2 * r + dy
  let origin = CGPoint(x: (SIZE - width) / 2, y: (SIZE - height) / 2)
  let left = CGRect(x: origin.x, y: origin.y + dy, width: 2 * r, height: 2 * r)
  let right = CGRect(x: origin.x + dx, y: origin.y, width: 2 * r, height: 2 * r)
  if filled {
    // Par-impar: donde los círculos se encuentran queda hueco
    ctx.addEllipse(in: left)
    ctx.addEllipse(in: right)
    ctx.drawPath(using: .eoFill)
  } else {
    ctx.setLineWidth(STROKE)
    ctx.strokeEllipse(in: left.insetBy(dx: STROKE / 2, dy: STROKE / 2))
    ctx.strokeEllipse(in: right.insetBy(dx: STROKE / 2, dy: STROKE / 2))
  }
}

func render(_ name: String, scale: CGFloat, draw: (CGContext) -> Void) throws {
  let px = Int(SIZE * scale)
  let ctx = CGContext(
    data: nil, width: px, height: px, bitsPerComponent: 8, bytesPerRow: 0,
    space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  // Coordenadas con el origen arriba a la izquierda, en pt
  ctx.translateBy(x: 0, y: CGFloat(px))
  ctx.scaleBy(x: scale, y: -scale)
  ctx.setFillColor(NSColor.black.cgColor)
  ctx.setStrokeColor(NSColor.black.cgColor)
  draw(ctx)

  let suffix = scale == 1 ? "" : "@\(Int(scale))x"
  let rep = NSBitmapImageRep(cgImage: ctx.makeImage()!)
  let url = URL(fileURLWithPath: "\(OUT_DIR)/\(name)\(suffix).png")
  try rep.representation(using: .png, properties: [:])!.write(to: url)
}

try FileManager.default.createDirectory(atPath: OUT_DIR, withIntermediateDirectories: true)
for scale: CGFloat in [1, 2, 3] {
  try render("home", scale: scale) { house($0, filled: false) }
  try render("home-fill", scale: scale) { house($0, filled: true) }
  try render("meeet-in", scale: scale) { circles($0, filled: false) }
  try render("meeet-in-fill", scale: scale) { circles($0, filled: true) }
}
print("Iconos de pestaña generados en \(OUT_DIR)")
