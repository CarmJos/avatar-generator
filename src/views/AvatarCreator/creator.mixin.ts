import Vue from "vue";
import Component from "vue-class-component";
import { generateAvatar, GenerateOptions } from "./generator";
import { CreateAvatarDto } from "./dto/create-avatar.dto";
import { GenderType, RenderType } from "./interface/avatar.interface";

@Component
export default class AvatarCreatorMixin extends Vue {
  async createOne(config: CreateAvatarDto): Promise<string> {
    const genderMap: Record<string, string> = {
      [GenderType.UNSET]: "0",
      [GenderType.MALE]: "1",
      [GenderType.FEMAL]: "2",
    };

    const options: GenerateOptions = {
      size: config.size,
      gender: genderMap[config.gender || GenderType.UNSET] || "0",
    };

    return generateAvatar(options, async (dir: string, filename: string) => {
      return (
        await require(`!!raw-loader!./resource/${dir}/${filename}.svg`)
      ).default;
    });
  }

  async createOneWithSeed(seed: string, size = 280): Promise<string> {
    return generateAvatar(
      { seed, size },
      async (dir: string, filename: string) => {
        return (
          await require(`!!raw-loader!./resource/${dir}/${filename}.svg`)
        ).default;
      }
    );
  }
}
