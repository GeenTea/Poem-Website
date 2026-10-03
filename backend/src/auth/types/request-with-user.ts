export interface JwtPayload{
    sub: string;
    email: string;
    sessionId: string;
}

export interface RequestWithUser extends Request{
    user: JwtPayload
}