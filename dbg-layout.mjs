import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader.ts"
import { componentRegistry } from "./quartz/components/registry.ts"

const config = await loadQuartzConfig()
const layout = await loadQuartzLayout()

console.log("=== registered component keys ===")
console.log([...componentRegistry.getAll().keys()].join("\n"))
console.log("\n=== defaults ===")
console.log("right:", layout.defaults.right?.length)
console.log("afterBody:", layout.defaults.afterBody?.length)
console.log("footer:", typeof layout.defaults.footer)
console.log("content.byPageType right:", layout.byPageType.content?.right?.length)
