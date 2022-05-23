// 패스워드 검증 정규식
export const passwordRegex = RegExp(
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&;()+\-_=/~`[\]{}'".,])[A-Za-z\d@$!%*#?&;()+\-_=/~`[\]{}'".,]{8,}$/,
);

// Enums
// Git 저장소 모드
export const GIT_RULE_1 = 1;
export const GIT_RULE_2 = 2;
