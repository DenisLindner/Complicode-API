import { IsBoolean, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator"

export class CreateChallengeDTO {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(150)
    title: string

    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(1000)
    body: string

    @IsBoolean()
    @IsNotEmpty()
    public: boolean
}