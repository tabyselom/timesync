import { IsString } from "class-validator";

export class transferOwnership {
  @IsString()
  newOwnerId: string;
}
