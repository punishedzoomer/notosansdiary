import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import imageLayoutStyle from "./styles/imageLayout.scss"
// @ts-ignore
import script from "./scripts/imageLayout.inline"
import { classNames } from "../util/lang"

export interface ImageLayoutImage {
  src: string
  alt?: string
  caption?: string
  width?: string | number
}

export interface ImageLayoutOptions {
  layout?: "a" | "b" | "c" | "grid" | "masonry" | "2-col" | "3-col" | "4-col"
  images?: ImageLayoutImage[]
  caption?: string
}

export default ((opts?: Partial<ImageLayoutOptions>) => {
  const ImageLayout: QuartzComponent = ({ displayClass, children, ...props }: QuartzComponentProps & { images?: ImageLayoutImage[]; layout?: string; caption?: string }) => {
    const layout = props.layout ?? opts?.layout ?? "grid"
    const images = props.images ?? opts?.images ?? []
    const globalCaption = props.caption ?? opts?.caption

    if (images.length === 0 && (!children || children.length === 0)) {
      return null
    }

    const layoutClass = `layout-${layout.toLowerCase().replace("image-layout-", "").replace("layout-", "")}`

    return (
      <div class={classNames(displayClass, "image-layout-wrapper")}>
        <div class={classNames("image-layout-container", layoutClass)}>
          {images.map((img) => (
            <div class="image-layout-card" key={img.src}>
              <div class="image-layout-img-wrapper">
                <img
                  src={img.src}
                  alt={img.alt || img.caption || ""}
                  class="image-layout-img"
                  loading="lazy"
                  style={img.width ? { maxWidth: typeof img.width === "number" ? `${img.width}px` : img.width } : undefined}
                />
              </div>
              {img.caption && <div class="image-layout-caption">{img.caption}</div>}
            </div>
          ))}
          {children}
        </div>
        {globalCaption && <div class="image-layout-global-caption">{globalCaption}</div>}
      </div>
    )
  }

  ImageLayout.css = imageLayoutStyle
  ImageLayout.afterDOMLoaded = script

  return ImageLayout
}) satisfies QuartzComponentConstructor
