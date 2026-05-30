<template>
  <div id="avatar-creator" :class="{ exporting }">
    <div
      :style="{
        width: `100%`,
        height: `${height}px`,
        display: 'flex',
        justifyContent: 'center',
      }"
      id="avatar-preview-outter-wrapper"
    >
      <div
        :style="{
          overflow: 'hidden',
          width: `${width}px`,
          height: exporting ? 0 : `${height}px`,
          '--bg': backgroundColor,
        }"
      >
        <div
          id="avatar-preview"
          :class="{ exporting }"
          :style="{
            width: `${width}px`,
            height: `${height}px`,
            backgroundColor,
            borderRadius,
            '--bg': backgroundColor,
          }"
        >
          <ExportLoading
            :ammount="
              Object.prototype.toString.call(ammount) === '[object String]'
                ? parseInt(ammount)
                : ammount
            "
            :progress="progress"
            v-if="showMask"
            :style="{
              width: `${width}px`,
              height: `${height}px`,
            }"
          />
          <div
            style="width: 100%;height: 100%;position: relative;z-index:2"
            v-html="svgRaw"
          ></div>
        </div>
      </div>
    </div>

    <div class="btns" style="margin-top: 40px;">
      <button
        id="refresh-btn"
        :disabled="exporting ? 'disabled' : false"
        @click="() => createAvatar()"
        class="__cursor_rect"
      >
        <i class="ri-refresh-line"></i>
        <span>{{ $t("random-avatar") }}</span>
      </button>

      <button
        class="__cursor_rect"
        id="download-btn"
        :disabled="exporting ? 'disabled' : false"
        @click="capture"
      >
        <i class="ri-file-download-line"></i>
        <span>
          {{ $t("download") }}
        </span>
      </button>
    </div>

    <div class="btns" style="margin-top: 10px;">
      <input
        v-model="ammount"
        type="number"
        class="sum-input __cursor_text"
        :placeholder="$t('input-amount-placeholder')"
        style="flex-grow: 1; margin-right: 10px;"
      />
      <button
        class="__cursor_rect"
        id="multiple-export-btn"
        style="min-width: 120px"
        :disabled="exporting || !ammount ? 'disabled' : false"
        @click="superMake"
      >
        <i class="ri-file-zip-fill"></i>
        <span>
          {{ $t("pack") }}
        </span>
      </button>
    </div>

    <div class="api-test-section">
      <h3>API 测试</h3>
      <div class="api-input-row">
        <input
          v-model="testSeed"
          type="text"
          class="api-input __cursor_text"
          placeholder="输入 email 或 md5"
        />
        <button
          class="__cursor_rect"
          id="api-test-btn"
          @click="testApi"
        >
          <i class="ri-link"></i>
          <span>测试 API</span>
        </button>
      </div>
      <label class="api-option-row __cursor_rect">
        <input v-model="testUseGravatar" type="checkbox" />
        <span>优先尝试 Gravatar</span>
      </label>
      <div v-if="apiResult" class="api-result">
        <img :src="apiResult" alt="API Result" />
      </div>
      <div class="api-info">
        <code>GET {{ apiTestUrl || '/api?seed=email|md5' }}</code>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import { Mixins } from "vue-property-decorator";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import AvatarCreatorMixin from "./creator.mixin";
import { RenderType, GenderType } from "./interface/avatar.interface";

@Component({
  components: {
    ExportLoading: () => import("@/components/ExportLoading.vue"),
  },
  mixins: [],
})
export default class AvatarCreator extends Mixins(AvatarCreatorMixin) {
  private width = 280;
  private height = 280;
  private exporting = false;
  private ammount = 100;
  private showMask = false;
  private progress = 0;

  private backgroundColor = "#fff";
  private borderRadius = "12px";

  private svgRaw = "";
  private testSeed = "";
  private apiResult = "";
  private testUseGravatar = false;
  private apiBaseUrl = process.env.BASE_URL || "/";

  private buildApiPath(path = ""): string {
    const base = this.apiBaseUrl.endsWith("/") ? this.apiBaseUrl : `${this.apiBaseUrl}/`;
    const normalizedPath = path.replace(/^\//, "");
    return `${base}${normalizedPath}`;
  }

  private get apiTestUrl(): string {
    if (!this.testSeed) return "";
    return `${this.buildApiPath("api")}?seed=${encodeURIComponent(this.testSeed)}&gravatar=${this.testUseGravatar}`;
  }

  mounted() {
    this.createAvatar();
  }

  private async createAvatar() {
    const svgRaw = await this.createOne({
      size: this.width,
      renderer: RenderType.SVG,
      amount: 1,
      gender: GenderType.UNSET,
    });

    this.svgRaw = svgRaw;

    const tempWrapper = document.createElement("div");
    tempWrapper.innerHTML = svgRaw;
    const bgGroup = tempWrapper.querySelector("#gaoxia-avatar-Background");
    if (bgGroup) {
      const bgRect = bgGroup.querySelector("rect");
      if (bgRect)
        this.backgroundColor = bgRect.getAttribute("fill") || "#fff";
    }
  }

  async capture() {
    this.exporting = true;
    this.borderRadius = "0";
    this.$nextTick(async () => {
      const dom: HTMLElement = document.querySelector(
        "#avatar-preview"
      ) as HTMLElement;
      const canvas = await html2canvas(dom, {
        logging: false,
        scale: window.devicePixelRatio,
        width: this.width,
        height: this.height,
      });
      const a = document.createElement("a");
      a.href = canvas.toDataURL();
      a.download = "avatar.png";
      a.click();
      this.exporting = false;
      this.borderRadius = "12px";
    });
  }

  async superMake() {
    setTimeout(() => {
      this.exporting = true;
      this.showMask = true;
      let { ammount } = this;
      const max = 10000;
      ammount = ammount > max ? max : ammount < 0 ? 1 : ammount;
      this.ammount = ammount;
      this.progress = 0;

      const zip = new JSZip();
      this.borderRadius = "0";

      this.$nextTick(async () => {
        for (let i = 0; i < ammount; i++) {
          this.createAvatar();
          const dom: HTMLElement = document.querySelector(
            "#avatar-preview"
          ) as HTMLElement;

          const canvas = await html2canvas(dom, {
            logging: false,
            scale: window.devicePixelRatio * 2,
            width: this.width,
            height: this.height,
            ignoreElements: this.exportIgnoreMiddleware as any,
          });

          const dataUrl = canvas
            .toDataURL()
            .replace("data:image/png;base64,", "");
          zip.file(`${i + 1}.png`, dataUrl, { base64: true });
          this.progress = i + 1;
        }
        const base64 = await zip.generateAsync({ type: "base64" });
        const a = document.createElement("a");
        a.href = "data:application/zip;base64," + base64;
        a.download = "avatar.zip";
        a.click();
        this.exporting = false;
        this.showMask = false;
      });
    }, 0);
  }

  exportIgnoreMiddleware(el: HTMLElement) {
    if (el && el.getAttribute("class")) {
      const ignores = ["export-loading"];
      if (
        el &&
        ignores.some(
          (className) =>
            [el.getAttribute("class") || ""].indexOf(className) > -1
        )
      )
        return true;
    }
    return false;
  }

  testApi() {
    if (!this.testSeed) return;
    this.apiResult = this.apiTestUrl;
  }
}
</script>

<style lang="scss" scoped>
$primary: #0067b6;
#avatar-creator {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);

  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;

  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  padding: 50px 30px 20px 30px;
  box-shadow: 12px 20px 40px rgba(0, 0, 0, 0.1),
    5px 5px 10px rgba(0, 0, 0, 0.02);
  z-index: 9;
  backdrop-filter: saturate(180%) blur(12px);

  max-width: 360px;

  .btns {
    display: flex;
    flex-wrap: nowrap;
    justify-content: space-between;
  }
  button {
    border: none;
    height: 40px;
    border-radius: 7px;
    cursor: pointer;
    &:focus,
    &:active {
      outline: none;
    }

    &:active {
      box-shadow: 0px 0px 2px rgba($primary, 0.5);
    }

    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;

    i {
      margin-right: 10px;
    }

    &#refresh-btn {
      background-color: $primary;
      color: #fff;
      width: calc(50% - 5px);

      &:hover {
        background-color: #06538d;
      }
    }
    &#download-btn {
      background-color: transparent;
      border: 1px solid $primary;
      color: $primary;
      width: calc(50% - 5px);

      &:hover {
        background-color: $primary;
        color: #fff;
      }
    }
  }
  input {
    background-color: #efefef;
    border-radius: 7px;
    border: none;
    padding: 0 10px;
    &:focus,
    &:active {
      outline: none;
    }
  }

  button#multiple-export-btn {
    width: calc(40% - 10px);
    color: $primary;
    background-color: rgba($primary, 0.1);
    &:hover {
      background-color: rgba($primary, 0.15);
    }
  }
  input.sum-input {
    width: 50%;
  }

  button:disabled {
    background-color: #efefef !important;
    color: grey !important;
    cursor: not-allowed;
    border: none !important;
  }
}

#avatar-preview {
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: fixed;
    width: inherit;
    height: inherit;
    border-radius: inherit;
    transform: scale(0.95);
    box-shadow: 0px 15px 30px var(--bg);
    opacity: 1;
  }

  &.exporting::before {
    box-shadow: none;
  }
}
#avatar-creator.exporting #avatar-preview::after {
  visibility: hidden !important;
}

.api-test-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;

  h3 {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 10px;
    font-weight: normal;
  }

  .api-input-row {
    display: flex;
    gap: 10px;
  }

  .api-option-row {
    margin-top: 10px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    color: #666;
  }

  .api-input {
    flex: 1;
    height: 36px;
    font-size: 0.85rem;
  }

  #api-test-btn {
    height: 36px;
    background-color: rgba($primary, 0.1);
    color: $primary;
    font-size: 0.85rem;
    padding: 0 15px;

    &:hover {
      background-color: rgba($primary, 0.2);
    }
  }

  .api-result {
    margin-top: 15px;
    text-align: center;

    img {
      max-width: 200px;
      max-height: 200px;
      border-radius: 8px;
      border: 1px solid #eee;
    }
  }

  .api-info {
    margin-top: 10px;
    font-size: 0.75rem;
    color: #999;

    code {
      background-color: #f5f5f5;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
    }
  }
}

@media screen and (max-width: 400px) {
  #avatar-creator {
    width: 100%;
    max-width: 100%;
    height: 100%;
    border-radius: 0;
  }
}

@media (prefers-color-scheme: dark) {
  #avatar-creator {
    background-color: rgba(80, 80, 80, 0.2);

    input {
      background-color: #555;
      color: #eee;
    }

    button#multiple-export-btn {
      color: #fff;
      background-color: rgba($primary, 1);
      &:hover {
        background-color: rgba($primary, 0.8);
        color: #ccc;
      }
    }

    button:disabled {
      background-color: #686868 !important;
      color: grey !important;
    }

    .api-test-section {
      border-top-color: #555;

      h3 {
        color: #aaa;
      }

      .api-option-row {
        color: #aaa;
      }

      .api-info code {
        background-color: #444;
        color: #ccc;
      }
    }
  }
}

body.darkmode:not(.darkmode-off) {
  #avatar-creator {
    background-color: rgba(80, 80, 80, 0.2);

    input {
      background-color: #555;
      color: #eee;
    }

    button#multiple-export-btn {
      color: #fff;
      background-color: rgba($primary, 1);
      &:hover {
        background-color: rgba($primary, 0.8);
        color: #ccc;
      }
    }

    button:disabled {
      background-color: #686868 !important;
      color: grey !important;
    }

    .api-test-section {
      border-top-color: #555;

      h3 {
        color: #aaa;
      }

      .api-option-row {
        color: #aaa;
      }

      .api-info code {
        background-color: #444;
        color: #ccc;
      }
    }
  }
}
</style>
