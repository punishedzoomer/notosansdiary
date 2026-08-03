import NotFound from "./pages/404"
import Head from "./Head"
import Spacer from "./Spacer"
import DesktopOnly from "./DesktopOnly"
import MobileOnly from "./MobileOnly"
import Flex from "./Flex"
import ConditionalRender from "./ConditionalRender"
import Breadcrumbs from "./Breadcrumbs"
import ImageLayout from "./ImageLayout"
import { componentRegistry } from "./registry"

componentRegistry.register("Breadcrumbs", Breadcrumbs, "local")
componentRegistry.register("breadcrumbs", Breadcrumbs, "local")
componentRegistry.register("@quartz-community/breadcrumbs", Breadcrumbs, "local")

componentRegistry.register("ImageLayout", ImageLayout, "local")
componentRegistry.register("imageLayout", ImageLayout, "local")
componentRegistry.register("image-layout", ImageLayout, "local")
componentRegistry.register("@quartz-community/image-layout", ImageLayout, "local")

export { componentRegistry, defineComponent } from "./registry"
export { External } from "./external"
export type { ComponentManifest, RegisteredComponent } from "./registry"
export type { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

export { Head, Spacer, DesktopOnly, MobileOnly, NotFound, Flex, ConditionalRender, Breadcrumbs, ImageLayout }

