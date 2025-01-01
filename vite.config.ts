import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'
import requireTransform from 'vite-plugin-require-transform';
import { autoComplete, Plugin as importToCDN } from "vite-plugin-cdn-import"
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { NodePolyFillsPlugin } from './plugins/NodePolyFillsPlugin'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import vitePlugiCesium from 'vite-plugin-cesium'

// import wasm from "vite-plugin-wasm";
// import topLevelAwait from "vite-plugin-top-level-await";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // wasm(),
    // topLevelAwait(),
    visualizer({// 图形化文件大小，方便观察
      emitFile: false,
      filename: 'stats.html',
      // open: true,
      sourcemap: true
    }),
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 1024,
      algorithm: 'gzip',
      deleteOriginFile: true
    }),
    viteStaticCopy({
      targets: [
        {
          src: '../../static/', //相对于root: './src/pages/',
          dest: './'  //相对于 build.outDir: "../../dist/",
        }
      ]
    }),



    // NodePolyFillsPlugin(),
    // nodePolyfills(),

    // https://blog.csdn.net/l491453302/article/details/122243252
    // https://blog.csdn.net/weixin_43336525/article/details/14100366
    vitePlugiCesium(),


    // requireTransform({
    //   fileRegex: /.js$|.vue$/
    // }),
    // importToCDN({  // 此插件可以帮我们使用CDN方式引入第三方库，减小请求压力，同时也缩小项目体积
    //   modules: [
    //     autoComplete('axios'),
    //     autoComplete('vue'),
    //     autoComplete('moment'),
    //     autoComplete('lodash'),
    //     // {
    //     //   name: "vue",
    //     //   var: "Vue",
    //     //   path: "https://unpkg.com/vue@3.3.8"
    //     // },
    //     // {
    //     //   name: "moment",
    //     //   var:  "Moment",
    //     //   path: "https://unpkg.com/moment@2.29.4"
    //     // },
    //     // {
    //     //   name: "lodash",
    //     //   var:  "Lodash",
    //     //   path: "https://unpkg.com/lodash@4.17.21"
    //     // },
    //     {
    //       name: "element-plus",
    //       var: "ElementPlus",
    //       path: "https://unpkg.com/element-plus@2.4.2",
    //       css: "https://unpkg.com/element-plus/dist/index.css"
    //     },
    //     {
    //       name: 'pinia',
    //       var: 'pinia',
    //       path: "https://unpkg.com/pinia@2.1.7"
    //     },
    //     {
    //       name: "echarts",
    //       var: "echarts",
    //       path: "https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"
    //     },
    //     {
    //       name: "vue-router",
    //       var: "vue-router",
    //       path: "https://cdn.jsdelivr.net/npm/vue-router@4.2.5/dist/vue-router.global.min.js"
    //     },
    //     {
    //       name: "echarts-liquidfill",
    //       var: "echarts-liquidfill",
    //       path: "https://cdn.jsdelivr.net/npm/echarts-liquidfill@3.1.0/dist/echarts-liquidfill.min.js"
    //     },
    //   ],
    // }),
  ],

  // 设置scss的api类型为modern-compiler
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  },

  worker: {
    // Not needed with vite-plugin-top-level-await >= 1.3.0
    // format: "es",
    plugins: () => {
      return [
        // wasm(),
        // topLevelAwait()
      ]
    }
  },

  // TODO
  root: './src/pages/',
  build: {
    outDir: "../../dist/",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      plugins: [
      ],
      // 配置多页面
      input: {
        mwebgl: './src/pages/mWebgl/index.html',
        // mbabylon: './src/pages/mbabylon/index.html',
        // post1: './src/pages/post1/index.html',
        // post2: './src/pages/post2/index.html',
      },
      output: {
        // assetFileNames: '[ext]/[name]-[hash].[ext]', //静态文件输出的文件夹名称
        assetFileNames: (assetInfo) => {
          // 设置不同类型文件的输出路径及命名规则
          if (assetInfo.name &&
            assetInfo.type === 'asset' &&
            /\.(jpe?g|png|gif|svg)$/i.test(assetInfo.name)
          ) {
            return 'img/[name].[hash].[ext]' // 图像文件输出路径及命名规则
          }
          if (assetInfo.name &&
            assetInfo.type === 'asset' &&
            /\.(ttf|woff|woff2|eot)$/i.test(assetInfo.name)
          ) {
            return 'fonts/[name]-[hash].[ext]' // 字体文件输出路径及命名规则
          }
          return '[ext]/name1-[hash].[ext]' // 其他资源文件输出路径及命名规则
        },
        chunkFileNames: 'js/[name]-[hash].js',  //chunk包输出的文件夹名称
        entryFileNames: 'js/[name]-[hash].js',  //入口文件输出的文件夹名称
        compact: true,  //压缩代码，删除换行符等
        manualChunks(id) { //配置分包，id为文件的绝对路径 
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString()
          }
        }
      }
    },
  },

  define: {
  },
  resolve: {
    alias: [  //别名配置，引用src路径下的东西可以通过@如：import Layout from '@/layout/index.vue'
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src')
      }
    ],
  },

  // base: './',
  server: {
    host: '0.0.0.0',
    // port: 8080,
    // open: true //自动打开
    hmr: true,  // 开启热更新
    // https: {}, // 是否开启 https
    proxy: {
      // "/api": {
      //   target: "http://localhost:5072/api", // 凡是遇到 /api 路径的请求，都映射到 target 属性
      //   changeOrigin: true,// 需要代理跨域
      //   rewrite: (path) => path.replace(/^\/api/, ""), // 重写 api 为 空，就是去掉它
      // },
    },
  },
})

