import { IsString } from "class-validator";

export class TransferOwnership {
  @IsString()
  newOwnerId: string;
}
