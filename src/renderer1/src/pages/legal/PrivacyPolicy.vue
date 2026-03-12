<script setup lang="ts">
import PublicHeaderLayout from '@renderer/src/components/public-header/index.vue'
</script>

<template>
  <PublicHeaderLayout>
    <div class="flex min-h-full flex-col">
      <div class="flex flex-1 flex-col items-center py-10 px-6">
        <div class="w-full max-w-4xl text-sm leading-6 text-neutral-800">
          <div class="mb-6 flex items-center justify-between text-xs text-neutral-500">
            <RouterLink
              to="/login"
              class="underline underline-offset-4 hover:text-primary transition-colors"
            >
              返回登录
            </RouterLink>
          </div>

          <h1 class="mb-6 text-2xl font-semibold text-neutral-900">
            隐私政策
          </h1>
          <p class="mb-4 text-neutral-700">
            山西铭方营养科技有限公司（以下简称“我们”或“本公司”）非常重视对您的信息和与医疗业务相关数据的保护。
            本隐私政策仅适用于您在中华人民共和国大陆地区使用本公司提供的营养软件及相关服务的情形。
            在使用本软件前，请您认真阅读并充分理解本政策的全部内容。
          </p>

          <h2 class="mt-8 mb-3 text-lg font-semibold text-neutral-900">
            一、适用主体与角色说明
          </h2>
          <p class="mb-3">
            1.
            本软件主要面向医院及其他医疗服务机构等机构用户（包括其授权操作人员），不直接向患者个人提供服务。
          </p>
          <p class="mb-3">
            2.
            在通常情况下，医院等机构用户是医疗业务数据的控制者，我们在医院授权范围内，根据《中华人民共和国网络安全法》《数据安全法》
            《个人信息保护法》等法律法规，以数据处理者角色提供技术服务。
          </p>

          <h2 class="mt-8 mb-3 text-lg font-semibold text-neutral-900">
            二、我们收集和处理的信息类型
          </h2>
          <p class="mb-3">
            在合法、正当、必要的前提下，我们可能收集和处理以下信息类型（具体范围以双方书面合同及实际业务为准）：
          </p>
          <p class="mb-1">
            1.
            机构及账号信息：包括医院名称、统一社会信用代码、联系人信息、系统账号、角色、权限配置及操作记录等。
          </p>
          <p class="mb-1">
            2.
            业务数据：包括医药销售记录（如药品名称、数量、金额、科室信息等）、退款记录（如退款单号、金额、原因、审批流程等）、
            以及在对上述数据进行汇总分析后生成的各类统计报表。
          </p>
          <p class="mb-3">
            3.
            与患者相关的数据：如因业务需要涉及患者信息，我们通常鼓励并协助医院优先采用去标识化或匿名化处理方式，仅处理与统计、
            分析目的相关的必要字段，并在合同及内部流程中设置严格的访问控制和安全措施。
          </p>

          <h2 class="mt-8 mb-3 text-lg font-semibold text-neutral-900">
            三、信息使用目的
          </h2>
          <p class="mb-3">
            我们将依据合法、正当、必要原则，在以下目的范围内使用所收集的信息：
          </p>
          <p class="mb-1">
            1.
            向医院等机构提供和维护本软件的核心功能，包括自定义退款、医药销售数据查询与统计分析等；
          </p>
          <p class="mb-1">
            2. 协助医院实现对医药销售及营养相关业务的合规管理与内部审计；
          </p>
          <p class="mb-1">
            3. 保障系统及数据安全，包括身份验证、权限控制、安全监测与风险防范；
          </p>
          <p class="mb-3">
            4. 在符合法律法规及合同约定的前提下，用于产品优化、服务改进及合规性审计等目的。
          </p>

          <h2 class="mt-8 mb-3 text-lg font-semibold text-neutral-900">
            四、信息的共享、转移与公开披露
          </h2>
          <p class="mb-3">
            1.
            除非取得医院或相关数据控制者的授权，或法律法规另有规定，我们不会向无关第三方共享您的数据。
          </p>
          <p class="mb-3">
            2.
            当我们为实现数据存储、系统托管或其他必要功能而委托第三方服务提供商处理数据时，我们将通过合同等方式要求其履行严格的保密和安全义务，
            并仅在必要范围内使用相关数据。
          </p>
          <p class="mb-3">
            3.
            如因合并、分立、资产转让等原因需要进行数据转移，我们将遵循法律法规要求，确保新持有方继续受本政策约束，或重新征求您的授权。
          </p>
          <p class="mb-3">
            4.
            我们不会公开披露业务数据或患者相关信息，除非事先取得合法授权或依据法律法规及监管要求必须披露。
          </p>

          <h2 class="mt-8 mb-3 text-lg font-semibold text-neutral-900">
            五、数据存储与安全保护
          </h2>
          <p class="mb-3">
            1.
            数据存储地点：我们通常在中华人民共和国境内的服务器上存储业务数据和个人信息，遵守国家对数据跨境传输的相关监管要求。
          </p>
          <p class="mb-3">
            2.
            存储期限：我们会在实现本政策所述目的所必需的最短期限内保存您的信息，并结合法律法规及合同约定确定具体保留时间。
            超出保存期限后，我们将删除或进行匿名化处理，除非法规或监管要求另有规定。
          </p>
          <p class="mb-3">
            3.
            安全措施：我们将采用合理可行的安全防护措施，包括访问控制、权限分级、日志审计、加密存储与传输等，以防止信息被未经授权访问、
            使用或泄露。同时，我们将建立内部安全管理制度并对员工进行安全培训。
          </p>

          <h2 class="mt-8 mb-3 text-lg font-semibold text-neutral-900">
            六、您的权利与行权方式
          </h2>
          <p class="mb-3">
            在适用法律允许的范围内，医院等数据控制者可就其控制的数据行使查询、复制、更正、删除、限制处理或数据导出等权利。
            我们将根据与您的合同约定和内部流程，协助您在合理期限内处理相关请求。
          </p>
          <p class="mb-3">
            如您对我们处理数据的方式有疑问、意见或投诉，可通过本政策列明的联系方式与我们沟通，我们将尽快核实并在合理期限内予以回复。
          </p>

          <h2 class="mt-8 mb-3 text-lg font-semibold text-neutral-900">
            七、未成年人信息保护
          </h2>
          <p class="mb-3">
            本软件不直接面向未成年人提供服务。若在医疗业务中涉及未成年患者的数据处理，我们将依据医院内部制度及相关法律法规要求，
            在医院和监护人授权范围内，采取更为严格的保护措施，并尽量采用去标识化或匿名化技术。
          </p>

          <h2 class="mt-8 mb-3 text-lg font-semibold text-neutral-900">
            八、本政策的更新
          </h2>
          <p class="mb-3">
            我们可能根据业务发展、监管要求或法律法规变化适时更新本隐私政策。
            如涉及重大变更，我们将通过系统公告、弹窗提示或其他适当方式进行说明。您继续使用本软件，即视为接受更新后的政策。
          </p>

          <h2 class="mt-8 mb-3 text-lg font-semibold text-neutral-900">
            九、联系方式
          </h2>
          <p class="mb-3">
            如您对本隐私政策有任何疑问、意见或投诉，或希望就数据处理相关事宜与我们联系，请通过以下方式与我们取得联系：
          </p>
          <p class="mb-1">
            公司名称：山西铭方营养科技有限公司
          </p>
          <p class="mb-1">
            联系邮箱：（请在部署前填写）
          </p>
          <p class="mb-1">
            联系电话：（请在部署前填写）
          </p>
          <p class="mb-3">
            通讯地址：（请在部署前填写）
          </p>

          <p class="mt-10 text-xs text-neutral-500">
            本隐私政策适用中华人民共和国法律（不含冲突规范）。如与本地适用的强制性法律规定存在不一致之处，以该等强制性规定为准。
          </p>
        </div>
      </div>
    </div>
  </PublicHeaderLayout>
</template>
