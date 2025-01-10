// vite.config.ts
import { defineConfig } from "file:///C:/Users/admin/Desktop/frontend-visualization/node_modules/vite/dist/node/index.js";
import vue from "file:///C:/Users/admin/Desktop/frontend-visualization/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path from "path";
import { visualizer } from "file:///C:/Users/admin/Desktop/frontend-visualization/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import viteCompression from "file:///C:/Users/admin/Desktop/frontend-visualization/node_modules/vite-plugin-compression/dist/index.mjs";
import { viteStaticCopy } from "file:///C:/Users/admin/Desktop/frontend-visualization/node_modules/vite-plugin-static-copy/dist/index.js";
import vitePlugiCesium from "file:///C:/Users/admin/Desktop/frontend-visualization/node_modules/vite-plugin-cesium/dist/index.mjs";
var __vite_injected_original_dirname = "C:\\Users\\admin\\Desktop\\frontend-visualization";
var vite_config_default = defineConfig({
  plugins: [
    vue(),
    // wasm(),
    // topLevelAwait(),
    visualizer({
      // 图形化文件大小，方便观察
      emitFile: false,
      filename: "stats.html",
      // open: true,
      sourcemap: true
    }),
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 1024,
      algorithm: "gzip",
      deleteOriginFile: true
    }),
    viteStaticCopy({
      targets: [
        {
          src: "../../static/",
          //相对于root: './src/pages/',
          dest: "./"
          //相对于 build.outDir: "../../dist/",
        }
      ]
    }),
    // NodePolyFillsPlugin(),
    // nodePolyfills(),
    // https://blog.csdn.net/l491453302/article/details/122243252
    // https://blog.csdn.net/weixin_43336525/article/details/14100366
    vitePlugiCesium()
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
  worker: {
    // Not needed with vite-plugin-top-level-await >= 1.3.0
    // format: "es",
    plugins: () => {
      return [
        // wasm(),
        // topLevelAwait()
      ];
    }
  },
  // TODO
  root: "./src/pages/",
  build: {
    outDir: "../../dist/",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      plugins: [],
      // input: getEntryPath(),// 配置多页面
      input: {
        // mbabylon: './src/pages/mbabylon/index.html',
        post1: "./src/pages/post1/index.html",
        post2: "./src/pages/post2/index.html"
      },
      output: {
        // assetFileNames: '[ext]/[name]-[hash].[ext]', //静态文件输出的文件夹名称
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.type === "asset" && /\.(jpe?g|png|gif|svg)$/i.test(assetInfo.name)) {
            return "img/[name].[hash].[ext]";
          }
          if (assetInfo.name && assetInfo.type === "asset" && /\.(ttf|woff|woff2|eot)$/i.test(assetInfo.name)) {
            return "fonts/[name]-[hash].[ext]";
          }
          return "[ext]/name1-[hash].[ext]";
        },
        chunkFileNames: "js/[name]-[hash].js",
        //chunk包输出的文件夹名称
        entryFileNames: "js/[name]-[hash].js",
        //入口文件输出的文件夹名称
        compact: true,
        //压缩代码，删除换行符等
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return id.toString().split("node_modules/")[1].split("/")[0].toString();
          }
        }
      }
    }
  },
  define: {},
  resolve: {
    alias: [
      //别名配置，引用src路径下的东西可以通过@如：import Layout from '@/layout/index.vue'
      {
        find: "@",
        replacement: path.resolve(__vite_injected_original_dirname, "src")
      }
    ]
  },
  // base: './',
  server: {
    host: "0.0.0.0",
    // port: 8080,
    // open: true //自动打开
    hmr: true,
    // 开启热更新
    // https: {}, // 是否开启 https
    proxy: {
      // "/api": {
      //   target: "http://localhost:5072/api", // 凡是遇到 /api 路径的请求，都映射到 target 属性
      //   changeOrigin: true,// 需要代理跨域
      //   rewrite: (path) => path.replace(/^\/api/, ""), // 重写 api 为 空，就是去掉它
      // },
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhZG1pblxcXFxEZXNrdG9wXFxcXGZyb250ZW5kLXZpc3VhbGl6YXRpb25cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGFkbWluXFxcXERlc2t0b3BcXFxcZnJvbnRlbmQtdmlzdWFsaXphdGlvblxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvYWRtaW4vRGVza3RvcC9mcm9udGVuZC12aXN1YWxpemF0aW9uL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXHJcbmltcG9ydCB7IHZpc3VhbGl6ZXIgfSBmcm9tICdyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXInXHJcbmltcG9ydCB2aXRlQ29tcHJlc3Npb24gZnJvbSAndml0ZS1wbHVnaW4tY29tcHJlc3Npb24nXHJcbmltcG9ydCByZXF1aXJlVHJhbnNmb3JtIGZyb20gJ3ZpdGUtcGx1Z2luLXJlcXVpcmUtdHJhbnNmb3JtJztcclxuaW1wb3J0IHsgYXV0b0NvbXBsZXRlLCBQbHVnaW4gYXMgaW1wb3J0VG9DRE4gfSBmcm9tIFwidml0ZS1wbHVnaW4tY2RuLWltcG9ydFwiXHJcbmltcG9ydCB7IHZpdGVTdGF0aWNDb3B5IH0gZnJvbSAndml0ZS1wbHVnaW4tc3RhdGljLWNvcHknXHJcbmltcG9ydCB7IE5vZGVQb2x5RmlsbHNQbHVnaW4gfSBmcm9tICcuL3BsdWdpbnMvTm9kZVBvbHlGaWxsc1BsdWdpbidcclxuaW1wb3J0IHsgbm9kZVBvbHlmaWxscyB9IGZyb20gJ3ZpdGUtcGx1Z2luLW5vZGUtcG9seWZpbGxzJ1xyXG5pbXBvcnQgdml0ZVBsdWdpQ2VzaXVtIGZyb20gJ3ZpdGUtcGx1Z2luLWNlc2l1bSdcclxuXHJcbi8vIGltcG9ydCB3YXNtIGZyb20gXCJ2aXRlLXBsdWdpbi13YXNtXCI7XHJcbi8vIGltcG9ydCB0b3BMZXZlbEF3YWl0IGZyb20gXCJ2aXRlLXBsdWdpbi10b3AtbGV2ZWwtYXdhaXRcIjtcclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcGx1Z2luczogW1xyXG4gICAgdnVlKCksXHJcbiAgICAvLyB3YXNtKCksXHJcbiAgICAvLyB0b3BMZXZlbEF3YWl0KCksXHJcbiAgICB2aXN1YWxpemVyKHsvLyBcdTU2RkVcdTVGNjJcdTUzMTZcdTY1ODdcdTRFRjZcdTU5MjdcdTVDMEZcdUZGMENcdTY1QjlcdTRGQkZcdTg5QzJcdTVCREZcclxuICAgICAgZW1pdEZpbGU6IGZhbHNlLFxyXG4gICAgICBmaWxlbmFtZTogJ3N0YXRzLmh0bWwnLFxyXG4gICAgICAvLyBvcGVuOiB0cnVlLFxyXG4gICAgICBzb3VyY2VtYXA6IHRydWVcclxuICAgIH0pLFxyXG4gICAgdml0ZUNvbXByZXNzaW9uKHtcclxuICAgICAgdmVyYm9zZTogdHJ1ZSxcclxuICAgICAgZGlzYWJsZTogZmFsc2UsXHJcbiAgICAgIHRocmVzaG9sZDogMTAyNCxcclxuICAgICAgYWxnb3JpdGhtOiAnZ3ppcCcsXHJcbiAgICAgIGRlbGV0ZU9yaWdpbkZpbGU6IHRydWVcclxuICAgIH0pLFxyXG4gICAgdml0ZVN0YXRpY0NvcHkoe1xyXG4gICAgICB0YXJnZXRzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgc3JjOiAnLi4vLi4vc3RhdGljLycsIC8vXHU3NkY4XHU1QkY5XHU0RThFcm9vdDogJy4vc3JjL3BhZ2VzLycsXHJcbiAgICAgICAgICBkZXN0OiAnLi8nICAvL1x1NzZGOFx1NUJGOVx1NEU4RSBidWlsZC5vdXREaXI6IFwiLi4vLi4vZGlzdC9cIixcclxuICAgICAgICB9XHJcbiAgICAgIF1cclxuICAgIH0pLFxyXG5cclxuXHJcblxyXG4gICAgLy8gTm9kZVBvbHlGaWxsc1BsdWdpbigpLFxyXG4gICAgLy8gbm9kZVBvbHlmaWxscygpLFxyXG5cclxuICAgIC8vIGh0dHBzOi8vYmxvZy5jc2RuLm5ldC9sNDkxNDUzMzAyL2FydGljbGUvZGV0YWlscy8xMjIyNDMyNTJcclxuICAgIC8vIGh0dHBzOi8vYmxvZy5jc2RuLm5ldC93ZWl4aW5fNDMzMzY1MjUvYXJ0aWNsZS9kZXRhaWxzLzE0MTAwMzY2XHJcbiAgICB2aXRlUGx1Z2lDZXNpdW0oKSxcclxuXHJcblxyXG4gICAgLy8gcmVxdWlyZVRyYW5zZm9ybSh7XHJcbiAgICAvLyAgIGZpbGVSZWdleDogLy5qcyR8LnZ1ZSQvXHJcbiAgICAvLyB9KSxcclxuICAgIC8vIGltcG9ydFRvQ0ROKHsgIC8vIFx1NkI2NFx1NjNEMlx1NEVGNlx1NTNFRlx1NEVFNVx1NUUyRVx1NjIxMVx1NEVFQ1x1NEY3Rlx1NzUyOENETlx1NjVCOVx1NUYwRlx1NUYxNVx1NTE2NVx1N0IyQ1x1NEUwOVx1NjVCOVx1NUU5M1x1RkYwQ1x1NTFDRlx1NUMwRlx1OEJGN1x1NkM0Mlx1NTM4Qlx1NTI5Qlx1RkYwQ1x1NTQwQ1x1NjVGNlx1NEU1Rlx1N0YyOVx1NUMwRlx1OTg3OVx1NzZFRVx1NEY1M1x1NzlFRlxyXG4gICAgLy8gICBtb2R1bGVzOiBbXHJcbiAgICAvLyAgICAgYXV0b0NvbXBsZXRlKCdheGlvcycpLFxyXG4gICAgLy8gICAgIGF1dG9Db21wbGV0ZSgndnVlJyksXHJcbiAgICAvLyAgICAgYXV0b0NvbXBsZXRlKCdtb21lbnQnKSxcclxuICAgIC8vICAgICBhdXRvQ29tcGxldGUoJ2xvZGFzaCcpLFxyXG4gICAgLy8gICAgIC8vIHtcclxuICAgIC8vICAgICAvLyAgIG5hbWU6IFwidnVlXCIsXHJcbiAgICAvLyAgICAgLy8gICB2YXI6IFwiVnVlXCIsXHJcbiAgICAvLyAgICAgLy8gICBwYXRoOiBcImh0dHBzOi8vdW5wa2cuY29tL3Z1ZUAzLjMuOFwiXHJcbiAgICAvLyAgICAgLy8gfSxcclxuICAgIC8vICAgICAvLyB7XHJcbiAgICAvLyAgICAgLy8gICBuYW1lOiBcIm1vbWVudFwiLFxyXG4gICAgLy8gICAgIC8vICAgdmFyOiAgXCJNb21lbnRcIixcclxuICAgIC8vICAgICAvLyAgIHBhdGg6IFwiaHR0cHM6Ly91bnBrZy5jb20vbW9tZW50QDIuMjkuNFwiXHJcbiAgICAvLyAgICAgLy8gfSxcclxuICAgIC8vICAgICAvLyB7XHJcbiAgICAvLyAgICAgLy8gICBuYW1lOiBcImxvZGFzaFwiLFxyXG4gICAgLy8gICAgIC8vICAgdmFyOiAgXCJMb2Rhc2hcIixcclxuICAgIC8vICAgICAvLyAgIHBhdGg6IFwiaHR0cHM6Ly91bnBrZy5jb20vbG9kYXNoQDQuMTcuMjFcIlxyXG4gICAgLy8gICAgIC8vIH0sXHJcbiAgICAvLyAgICAge1xyXG4gICAgLy8gICAgICAgbmFtZTogXCJlbGVtZW50LXBsdXNcIixcclxuICAgIC8vICAgICAgIHZhcjogXCJFbGVtZW50UGx1c1wiLFxyXG4gICAgLy8gICAgICAgcGF0aDogXCJodHRwczovL3VucGtnLmNvbS9lbGVtZW50LXBsdXNAMi40LjJcIixcclxuICAgIC8vICAgICAgIGNzczogXCJodHRwczovL3VucGtnLmNvbS9lbGVtZW50LXBsdXMvZGlzdC9pbmRleC5jc3NcIlxyXG4gICAgLy8gICAgIH0sXHJcbiAgICAvLyAgICAge1xyXG4gICAgLy8gICAgICAgbmFtZTogJ3BpbmlhJyxcclxuICAgIC8vICAgICAgIHZhcjogJ3BpbmlhJyxcclxuICAgIC8vICAgICAgIHBhdGg6IFwiaHR0cHM6Ly91bnBrZy5jb20vcGluaWFAMi4xLjdcIlxyXG4gICAgLy8gICAgIH0sXHJcbiAgICAvLyAgICAge1xyXG4gICAgLy8gICAgICAgbmFtZTogXCJlY2hhcnRzXCIsXHJcbiAgICAvLyAgICAgICB2YXI6IFwiZWNoYXJ0c1wiLFxyXG4gICAgLy8gICAgICAgcGF0aDogXCJodHRwczovL2Nkbi5qc2RlbGl2ci5uZXQvbnBtL2VjaGFydHNANS40LjMvZGlzdC9lY2hhcnRzLm1pbi5qc1wiXHJcbiAgICAvLyAgICAgfSxcclxuICAgIC8vICAgICB7XHJcbiAgICAvLyAgICAgICBuYW1lOiBcInZ1ZS1yb3V0ZXJcIixcclxuICAgIC8vICAgICAgIHZhcjogXCJ2dWUtcm91dGVyXCIsXHJcbiAgICAvLyAgICAgICBwYXRoOiBcImh0dHBzOi8vY2RuLmpzZGVsaXZyLm5ldC9ucG0vdnVlLXJvdXRlckA0LjIuNS9kaXN0L3Z1ZS1yb3V0ZXIuZ2xvYmFsLm1pbi5qc1wiXHJcbiAgICAvLyAgICAgfSxcclxuICAgIC8vICAgICB7XHJcbiAgICAvLyAgICAgICBuYW1lOiBcImVjaGFydHMtbGlxdWlkZmlsbFwiLFxyXG4gICAgLy8gICAgICAgdmFyOiBcImVjaGFydHMtbGlxdWlkZmlsbFwiLFxyXG4gICAgLy8gICAgICAgcGF0aDogXCJodHRwczovL2Nkbi5qc2RlbGl2ci5uZXQvbnBtL2VjaGFydHMtbGlxdWlkZmlsbEAzLjEuMC9kaXN0L2VjaGFydHMtbGlxdWlkZmlsbC5taW4uanNcIlxyXG4gICAgLy8gICAgIH0sXHJcbiAgICAvLyAgIF0sXHJcbiAgICAvLyB9KSxcclxuICBdLFxyXG5cclxuICB3b3JrZXI6IHtcclxuICAgIC8vIE5vdCBuZWVkZWQgd2l0aCB2aXRlLXBsdWdpbi10b3AtbGV2ZWwtYXdhaXQgPj0gMS4zLjBcclxuICAgIC8vIGZvcm1hdDogXCJlc1wiLFxyXG4gICAgcGx1Z2luczogKCkgPT4ge1xyXG4gICAgICByZXR1cm4gW1xyXG4gICAgICAgIC8vIHdhc20oKSxcclxuICAgICAgICAvLyB0b3BMZXZlbEF3YWl0KClcclxuICAgICAgXVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8vIFRPRE9cclxuICByb290OiAnLi9zcmMvcGFnZXMvJyxcclxuICBidWlsZDoge1xyXG4gICAgb3V0RGlyOiBcIi4uLy4uL2Rpc3QvXCIsXHJcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcclxuICAgIHNvdXJjZW1hcDogdHJ1ZSxcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgcGx1Z2luczogW1xyXG4gICAgICBdLFxyXG4gICAgICAvLyBpbnB1dDogZ2V0RW50cnlQYXRoKCksLy8gXHU5MTREXHU3RjZFXHU1OTFBXHU5ODc1XHU5NzYyXHJcbiAgICAgIGlucHV0OiB7XHJcbiAgICAgICAgLy8gbWJhYnlsb246ICcuL3NyYy9wYWdlcy9tYmFieWxvbi9pbmRleC5odG1sJyxcclxuICAgICAgICBwb3N0MTogJy4vc3JjL3BhZ2VzL3Bvc3QxL2luZGV4Lmh0bWwnLFxyXG4gICAgICAgIHBvc3QyOiAnLi9zcmMvcGFnZXMvcG9zdDIvaW5kZXguaHRtbCcsXHJcbiAgICAgIH0sXHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIC8vIGFzc2V0RmlsZU5hbWVzOiAnW2V4dF0vW25hbWVdLVtoYXNoXS5bZXh0XScsIC8vXHU5NzU5XHU2MDAxXHU2NTg3XHU0RUY2XHU4RjkzXHU1MUZBXHU3Njg0XHU2NTg3XHU0RUY2XHU1OTM5XHU1NDBEXHU3OUYwXHJcbiAgICAgICAgYXNzZXRGaWxlTmFtZXM6IChhc3NldEluZm8pID0+IHtcclxuICAgICAgICAgIC8vIFx1OEJCRVx1N0Y2RVx1NEUwRFx1NTQwQ1x1N0M3Qlx1NTc4Qlx1NjU4N1x1NEVGNlx1NzY4NFx1OEY5M1x1NTFGQVx1OERFRlx1NUY4NFx1NTNDQVx1NTQ3RFx1NTQwRFx1ODlDNFx1NTIxOVxyXG4gICAgICAgICAgaWYgKGFzc2V0SW5mby5uYW1lICYmXHJcbiAgICAgICAgICAgIGFzc2V0SW5mby50eXBlID09PSAnYXNzZXQnICYmXHJcbiAgICAgICAgICAgIC9cXC4oanBlP2d8cG5nfGdpZnxzdmcpJC9pLnRlc3QoYXNzZXRJbmZvLm5hbWUpXHJcbiAgICAgICAgICApIHtcclxuICAgICAgICAgICAgcmV0dXJuICdpbWcvW25hbWVdLltoYXNoXS5bZXh0XScgLy8gXHU1NkZFXHU1MENGXHU2NTg3XHU0RUY2XHU4RjkzXHU1MUZBXHU4REVGXHU1Rjg0XHU1M0NBXHU1NDdEXHU1NDBEXHU4OUM0XHU1MjE5XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoYXNzZXRJbmZvLm5hbWUgJiZcclxuICAgICAgICAgICAgYXNzZXRJbmZvLnR5cGUgPT09ICdhc3NldCcgJiZcclxuICAgICAgICAgICAgL1xcLih0dGZ8d29mZnx3b2ZmMnxlb3QpJC9pLnRlc3QoYXNzZXRJbmZvLm5hbWUpXHJcbiAgICAgICAgICApIHtcclxuICAgICAgICAgICAgcmV0dXJuICdmb250cy9bbmFtZV0tW2hhc2hdLltleHRdJyAvLyBcdTVCNTdcdTRGNTNcdTY1ODdcdTRFRjZcdThGOTNcdTUxRkFcdThERUZcdTVGODRcdTUzQ0FcdTU0N0RcdTU0MERcdTg5QzRcdTUyMTlcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiAnW2V4dF0vbmFtZTEtW2hhc2hdLltleHRdJyAvLyBcdTUxNzZcdTRFRDZcdThENDRcdTZFOTBcdTY1ODdcdTRFRjZcdThGOTNcdTUxRkFcdThERUZcdTVGODRcdTUzQ0FcdTU0N0RcdTU0MERcdTg5QzRcdTUyMTlcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiAnanMvW25hbWVdLVtoYXNoXS5qcycsICAvL2NodW5rXHU1MzA1XHU4RjkzXHU1MUZBXHU3Njg0XHU2NTg3XHU0RUY2XHU1OTM5XHU1NDBEXHU3OUYwXHJcbiAgICAgICAgZW50cnlGaWxlTmFtZXM6ICdqcy9bbmFtZV0tW2hhc2hdLmpzJywgIC8vXHU1MTY1XHU1M0UzXHU2NTg3XHU0RUY2XHU4RjkzXHU1MUZBXHU3Njg0XHU2NTg3XHU0RUY2XHU1OTM5XHU1NDBEXHU3OUYwXHJcbiAgICAgICAgY29tcGFjdDogdHJ1ZSwgIC8vXHU1MzhCXHU3RjI5XHU0RUUzXHU3ODAxXHVGRjBDXHU1MjIwXHU5NjY0XHU2MzYyXHU4ODRDXHU3QjI2XHU3QjQ5XHJcbiAgICAgICAgbWFudWFsQ2h1bmtzKGlkKSB7IC8vXHU5MTREXHU3RjZFXHU1MjA2XHU1MzA1XHVGRjBDaWRcdTRFM0FcdTY1ODdcdTRFRjZcdTc2ODRcdTdFRERcdTVCRjlcdThERUZcdTVGODQgXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpZC50b1N0cmluZygpLnNwbGl0KCdub2RlX21vZHVsZXMvJylbMV0uc3BsaXQoJy8nKVswXS50b1N0cmluZygpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gIH0sXHJcblxyXG4gIGRlZmluZToge1xyXG4gIH0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IFsgIC8vXHU1MjJCXHU1NDBEXHU5MTREXHU3RjZFXHVGRjBDXHU1RjE1XHU3NTI4c3JjXHU4REVGXHU1Rjg0XHU0RTBCXHU3Njg0XHU0RTFDXHU4OTdGXHU1M0VGXHU0RUU1XHU5MDFBXHU4RkM3QFx1NTk4Mlx1RkYxQWltcG9ydCBMYXlvdXQgZnJvbSAnQC9sYXlvdXQvaW5kZXgudnVlJ1xyXG4gICAgICB7XHJcbiAgICAgICAgZmluZDogJ0AnLFxyXG4gICAgICAgIHJlcGxhY2VtZW50OiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjJylcclxuICAgICAgfVxyXG4gICAgXSxcclxuICB9LFxyXG5cclxuICAvLyBiYXNlOiAnLi8nLFxyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogJzAuMC4wLjAnLFxyXG4gICAgLy8gcG9ydDogODA4MCxcclxuICAgIC8vIG9wZW46IHRydWUgLy9cdTgxRUFcdTUyQThcdTYyNTNcdTVGMDBcclxuICAgIGhtcjogdHJ1ZSwgIC8vIFx1NUYwMFx1NTQyRlx1NzBFRFx1NjZGNFx1NjVCMFxyXG4gICAgLy8gaHR0cHM6IHt9LCAvLyBcdTY2MkZcdTU0MjZcdTVGMDBcdTU0MkYgaHR0cHNcclxuICAgIHByb3h5OiB7XHJcbiAgICAgIC8vIFwiL2FwaVwiOiB7XHJcbiAgICAgIC8vICAgdGFyZ2V0OiBcImh0dHA6Ly9sb2NhbGhvc3Q6NTA3Mi9hcGlcIiwgLy8gXHU1MUUxXHU2NjJGXHU5MDQ3XHU1MjMwIC9hcGkgXHU4REVGXHU1Rjg0XHU3Njg0XHU4QkY3XHU2QzQyXHVGRjBDXHU5MEZEXHU2NjIwXHU1QzA0XHU1MjMwIHRhcmdldCBcdTVDNUVcdTYwMjdcclxuICAgICAgLy8gICBjaGFuZ2VPcmlnaW46IHRydWUsLy8gXHU5NzAwXHU4OTgxXHU0RUUzXHU3NDA2XHU4REU4XHU1N0RGXHJcbiAgICAgIC8vICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaS8sIFwiXCIpLCAvLyBcdTkxQ0RcdTUxOTkgYXBpIFx1NEUzQSBcdTdBN0FcdUZGMENcdTVDMzFcdTY2MkZcdTUzQkJcdTYzODlcdTVCODNcclxuICAgICAgLy8gfSxcclxuICAgIH0sXHJcbiAgfSxcclxufSlcclxuXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBbVUsU0FBUyxvQkFBb0I7QUFDaFcsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sVUFBVTtBQUNqQixTQUFTLGtCQUFrQjtBQUMzQixPQUFPLHFCQUFxQjtBQUc1QixTQUFTLHNCQUFzQjtBQUcvQixPQUFPLHFCQUFxQjtBQVY1QixJQUFNLG1DQUFtQztBQWdCekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsSUFBSTtBQUFBO0FBQUE7QUFBQSxJQUdKLFdBQVc7QUFBQTtBQUFBLE1BQ1QsVUFBVTtBQUFBLE1BQ1YsVUFBVTtBQUFBO0FBQUEsTUFFVixXQUFXO0FBQUEsSUFDYixDQUFDO0FBQUEsSUFDRCxnQkFBZ0I7QUFBQSxNQUNkLFNBQVM7QUFBQSxNQUNULFNBQVM7QUFBQSxNQUNULFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQSxNQUNYLGtCQUFrQjtB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
