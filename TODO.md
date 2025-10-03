# TODO: Fix Login Credential Checking and Error Handling

- [x] Modify `loginUser` in `services/auth.service.ts` to throw `new Error("Invalid credentials")` for both "user not found" and "invalid password" cases.
- [x] Modify `app/api/auth/login/route.ts` to catch errors from `loginUser` and return 401 status with the error message.
- [ ] Modify `authorize` function in `lib/auth.ts` to wrap `client.post` in try-catch block and throw the error message on axios errors.
- [ ] Test the login functionality with invalid credentials to ensure "Invalid credentials" is displayed.
