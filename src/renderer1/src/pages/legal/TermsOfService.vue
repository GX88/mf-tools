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
            服务条款
          </h1>
          <p class="mb-4 text-neutral-700">
            欢迎使用由山西铭方营养科技有限公司（以下简称“我们”或“本公司”）提供的营养软件及相关服务。
            在使用本软件前，请务必仔细阅读并充分理解本服务条款。您在安装、登录或实际使用本软件时，即视为您已阅读、
            理解并同意本条款的全部内容，并承诺遵守本条款以及适用的中华人民共和国法律法规。
          </p>

          <h2 class="mt-8 mb-3 text-lg font-semibold text-neutral-900">
            一、适用范围
          </h2>
          <p class="mb-3">
            1.
            本条款适用于我们在中华人民共和国大陆地区向医院及其他医疗服务机构等机构用户提供的营养管理及医药销售数据分析软件
            （以下简称“本软件”）及相关技术服务。
          </p>
          <p class="mb-3">
            2.
            本软件主要功能包括但不限于：为医院用户提供自定义退款配置及操作支持、查询医药销售数据、生成统计分析报表等。
          </p>
          <p class="mb-3">
            3.
            本软件不面向个人患者直接提供服务，您应确保仅在符合医院内部管理制度和法律法规要求的前提下使用本软件。
          </p>

          <h2 class="mt-8 mb-3 text-lg font-semibold text-neutral-900">
            二、账户与授权
          </h2>
          <p class="mb-3">
            1.
            本软件面向机构用户提供服务，机构应通过合法渠道申请开通本软件账户，并对其下属账号的创建、分配及权限管理承担全部责任。
          </p>
          <p class="mb-3">
            2.
            机构应确保其授权使用本软件的人员为具备相应资质和权限的在职员工或经正式授权的人员，并对其使用行为负责。
          </p>
          <p class="mb-3">
            3.
            您应妥善保管账户名、密码及其他身份验证信息，因保管不当或内部管理原因导致的账户泄露、误操作或数据丢失等后果由您自行承担。
          </p>

          <h2 class="mt-8 mb-3 text-lg font-semibold text-neutral-900">
            三、软件功能与使用边界
          </h2>
          <p class="mb-3">
            1.
            本软件仅作为医院内部业务管理和数据分析工具，为医疗机构提供决策辅助，不直接向患者提供诊疗建议或医疗行为指引。
          </p>
          <p class="mb-3">
            2.
            任何基于本软件展示的数据或统计结果所做出的医疗或运营决策，应由具有合法资质的专业人员根据自身判断和经验独立作出。
          </p>
          <p class="mb-3">
            3.
            您不得将本软件用于任何与授权用途无关或违反中国法律法规、公序良俗的活动，包括但不限于非法交易、数据倒卖或违规披露患者信息等。
          </p>

          <h2 class="mt-8 mb-3 text-lg font-semibold text-neutral-900">
            四、数据与知识产权
          </h2>
          <p class="mb-3">
            1.
            在您合法使用本软件过程中产生的业务数据（例如订单记录、退款记录、医药销售数据及相关统计结果），其控制权通常由医院或其他机构用户依据法律法规及双方合同约定享有。
            我们将在您授权的范围内，根据《中华人民共和国网络安全法》《数据安全法》《个人信息保护法》等法律法规的要求，对数据进行存储和处理。
          </p>
          <p class="mb-3">
            2.
            本软件的著作权、商标权、界面设计、程序代码及相关文档等知识产权归本公司所有。未经书面许可，您不得以任何方式复制、修改、反向工程、
            反编译、出售或转许可本软件。
          </p>
          <p class="mb-3">
            3.
            在不违反适用法律且经过匿名化、去标识化处理的前提下，我们有权对汇总后的统计数据进行分析，用于提升产品性能、优化算法和服务质量。
          </p>

          <h2 class="mt-8 mb-3 text-lg font-semibold text-neutral-900">
            五、合规使用与禁止行为
          </h2>
          <p class="mb-3">
            1.
            您在使用本软件时，应遵守与医疗、药品经营、数据安全和个人信息保护相关的法律法规及监管要求，包括但不限于《中华人民共和国网络安全法》、
            《数据安全法》《个人信息保护法》以及国家卫生健康行政部门和药品监管部门发布的规范性文件。
          </p>
          <p class="mb-3">
            2. 您不得从事包括但不限于以下行为：
          </p>
          <p class="mb-1">
            （1）擅自访问、下载、导出、出售或以其他方式非法使用患者信息或医药销售数据；
          </p>
          <p class="mb-1">
            （2）未取得合法授权向第三方提供医院内部业务数据或系统访问凭证；
          </p>
          <p class="mb-1">
            （3）故意攻击本软件或相关服务器，尝试绕过权限控制、探测系统漏洞或进行其他危害网络安全的行为；
          </p>
          <p class="mb-3">
            （4）将本软件用于任何违反中国法律法规或监管要求的用途。
          </p>

          <h2 class="mt-8 mb-3 text-lg font-semibold text-neutral-900">
            六、服务变更、中断与终止
          </h2>
          <p class="mb-3">
            1.
            我们有权根据业务发展和技术升级对本软件的功能进行优化、升级或调整，必要时会以系统通知、站内公告等方式予以提示。
          </p>
          <p class="mb-3">
            2.
            因下列情形导致服务中断或不可用的，我们将在能力范围内协助恢复，但在法律允许的范围内不承担由此引发的间接损失：
          </p>
          <p class="mb-1">
            （1）不可抗力或意外事件，包括但不限于自然灾害、战争、罢工、政策变化等；
          </p>
          <p class="mb-1">
            （2）电信运营商或网络服务提供商故障；
          </p>
          <p class="mb-1">
            （3）用户自身设备、网络环境或配置问题；
          </p>
          <p class="mb-3">
            （4）为保障系统安全与稳定而进行的计划内维护、升级等。
          </p>

          <h2 class="mt-8 mb-3 text-lg font-semibold text-neutral-900">
            七、责任限制
          </h2>
          <p class="mb-3">
            在适用法律允许的最大范围内，对于因使用或不能使用本软件而导致的任何间接损失、预期收益损失、数据丢失或业务中断等，
            我们不承担连带责任。对于可归责于我们的直接经济损失，通常以双方另行签署的书面合同中约定的责任上限为准。
          </p>

          <h2 class="mt-8 mb-3 text-lg font-semibold text-neutral-900">
            八、条款更新与适用法律
          </h2>
          <p class="mb-3">
            1.
            我们可能根据业务发展、监管要求或法律法规变化对本条款进行修订，并通过适当方式进行提示。您继续使用本软件，即视为接受更新后的条款。
          </p>
          <p class="mb-3">
            2. 本条款的订立、生效、履行和解释，均适用中华人民共和国法律（不含冲突规范）。
          </p>

          <h2 class="mt-8 mb-3 text-lg font-semibold text-neutral-900">
            九、争议解决
          </h2>
          <p class="mb-3">
            因本条款或使用本软件所引起的或与之相关的任何争议，双方应首先通过友好协商解决；
            协商不成的，任何一方均可向本公司住所地有管辖权的人民法院提起诉讼。
          </p>

          <p class="mt-10 text-xs text-neutral-500">
            本服务条款自您首次安装或使用本软件之日起生效。若您对条款内容有任何疑问，请与我们联系。
          </p>
        </div>
      </div>
    </div>
  </PublicHeaderLayout>
</template>
