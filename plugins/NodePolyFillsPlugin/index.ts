import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'
import rollupNodePolyFill from 'rollup-plugin-node-polyfills'
import { Plugin } from 'vite';
export function NodePolyFillsPlugin(): Plugin {
    return {
        name: 'vite-node-polyfills-plugins',
        config: async (options) => {
            return {
                resolve: {
                    alias: { //到node_modules.pnpm\rollup-plugin-node-polyfills@0.2.1\node_modules\rollup-plugin-node-polyfills\dist\index.js 这个路径下寻找
                        path: 'rollup-plugin-node-polyfills/polyfills/path',
                        buffer: 'rollup-plugin-node-polyfills/polyfills/buffer-es6',
                        // util: 'rollup-plugin-node-polyfills/polyfills/util',
                        // sys: 'util',
                        // events: 'rollup-plugin-node-polyfills/polyfills/events',
                        // stream: 'rollup-plugin-node-polyfills/polyfills/stream',
                        // querystring: 'rollup-plugin-node-polyfills/polyfills/qs',
                        // punycode: 'rollup-plugin-node-polyfills/polyfills/punycode',
                        // url: 'rollup-plugin-node-polyfills/polyfills/url',
                        // string_decoder: 'rollup-plugin-node-polyfills/polyfills/string-decoder',
                        // http: 'rollup-plugin-node-polyfills/polyfills/http',
                        // https: 'rollup-plugin-node-polyfills/polyfills/http',
                        // os: 'rollup-plugin-node-polyfills/polyfills/os',
                        // assert: 'rollup-plugin-node-polyfills/polyfills/assert',
                        // constants: 'rollup-plugin-node-polyfills/polyfills/constants',
                        // _stream_duplex: 'rollup-plugin-node-polyfills/polyfills/readable-stream/duplex',
                        // _stream_passthrough: 'rollup-plugin-node-polyfills/polyfills/readable-stream/passthrough',
                        // _stream_readable: 'rollup-plugin-node-polyfills/polyfills/readable-stream/readable',
                        // _stream_writable: 'rollup-plugin-node-polyfills/polyfills/readable-stream/writable',
                        // _stream_transform: 'rollup-plugin-node-polyfills/polyfills/readable-stream/transform',
                        // timers: 'rollup-plugin-node-polyfills/polyfills/timers',
                        // console: 'rollup-plugin-node-polyfills/polyfills/console',
                        // vm: 'rollup-plugin-node-polyfills/polyfills/vm',
                        // zlib: 'rollup-plugin-node-polyfills/polyfills/zlib',
                        // tty: 'rollup-plugin-node-polyfills/polyfills/tty',
                        // domain: 'rollup-plugin-node-polyfills/polyfills/domain'
                    }
                },
                optimizeDeps: {
                    esbuildOptions: {
                        define: { // Node.js global to browser globalThis
                            global: 'globalThis'
                        },
                        plugins: [
                            NodeGlobalsPolyfillPlugin({ // Enable esbuild polyfill plugins
                                process: true,
                                buffer: true,
                            }),
                            NodeModulesPolyfillPlugin()
                        ]
                    }
                },
                // Enable rollup polyfills plugin used during production bundling 
                plugins: [rollupNodePolyFill()]
            }
        }
    } as Plugin
}
