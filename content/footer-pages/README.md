# Footer 八页面品牌复用模板

英文原创通用正文，一页一份 HTML，可直接放入 Shopify Page 的正文（HTML）字段；模板不是已获法律批准的政策。

| 分组 | 标题 | 文件 / 建议 Handle |
|---|---|---|
| CUSTOMER CARE | Privacy Policy | `privacy-policy.html` / `privacy-policy` |
| CUSTOMER CARE | Return Policy | `return-policy.html` / `return-policy` |
| CUSTOMER CARE | Shipping Policy | `shipping-policy.html` / `shipping-policy` |
| CUSTOMER CARE | Service Policy | `service-policy.html` / `service-policy` |
| ORDER INFO | About Us | `about-us.html` / `about-us` |
| ORDER INFO | Contact Us | `contact-us.html` / `contact-us` |
| ORDER INFO | Terms Of Purchase | `terms-of-purchase.html` / `terms-of-purchase` |
| ORDER INFO | Terms Of Use | `terms-of-use.html` / `terms-of-use` |

## 渲染

```sh
npm run footer:render -- --brand "Example Brand" --store "https://example.com" --email "support@example.com"
```

真实项目可用已核验的 `BRAND_NAME`、`SHOPIFY_STOREFRONT_URL`、`SHOPIFY_CONTACT_EMAIL` 环境变量，避免重复输入。请从目标 Shopify 店铺读回这些事实；不能用上面的例子代替。

生成 `output/footer-pages/*.html` 和 `manifest.json`，不触及 Shopify 远端。执行阶段 3-pages-6 时，**优先复用店铺真实 Policy/Page**；缺失时以生成内容创建独立页面（必须拥有权限），再读回并绑到固定八链接 Footer。隐私政策如已由 Shopify Policies 管理，应优先保留该政策及其现有 URL，不用自动生成的 Page 覆盖。

模板刻意不填写退货期限、运费数字、配送时效、法律主体、客服地址、数据保留期限等未经证实的具体事项。使用者应先核实店铺的实际政策、服务提供商、法律要求和客户支持方式，特别是 Privacy/Return/Purchase/Use Terms。内容草稿可以通过技术验收，但不代表完成法律或运营审查。
