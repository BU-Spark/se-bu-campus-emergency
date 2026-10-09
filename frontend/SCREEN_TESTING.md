# Skeleton screen testing

Run commands from `frontend/` on branch `front-end-feature-1`.

## Start the app

1. Ensure `.env` exists with the URL and publishable key described in `.env.example`. Never commit `.env`.
2. Run `npm install` if dependencies have not been installed.
3. Run `npx expo start`, then open the project in a compatible Expo Go app using the QR code.
4. If campus Wi-Fi prevents the phone from connecting, stop the server and run `npx expo start --tunnel`.
5. For a browser preview, run `npm run web`. Browser preview does not verify native phone dialing.

## Manual checklist

- Home: seven red-icon category cards, readable labels, centered final card; scroll if necessary. The help button remains outside the scrolling content.
- Open each category: the title and instructions match the selected scenario. All backend instructions remain available, ordered by `step_order`.
- Guidance: tap a step heading to collapse and expand it. Section headings distinguish different situations, such as the suspicious-package, email and telephone sections.
- Back returns to the previous screen. Opening a detail URL directly still allows returning home.
- Call for Help opens Contacts. Charles River Campus and Medical Campus tabs show their respective contacts; ALL-campus contacts appear in both.
- Selecting a contact shows its name and number in a confirmation dialog. Cancel closes the dialog without invoking the phone app. Android Back should also dismiss the dialog.
- Do not place a real emergency call for testing or recording. Demonstrate the confirmation dialog and Cancel. The automated test verifies Call Now using a mocked phone API and fictional numbers.
- If a phone-call handler is unavailable, the confirmation dialog keeps the number visible and explains the failure.
- With the app already loaded, interrupt network access and navigate to a screen that fetches data. Verify the error and Try again action; restore connectivity and retry. Network failures can take time to surface.
- Check a small phone and larger system text: content should scroll without hiding instructions or the call-confirmation actions.

## Automated checks

```sh
npm test -- --runInBand
npm run lint
npm run typecheck
```

Screen tests mock the existing hooks and phone API. They cover category navigation, loading/error/retry states, instruction ordering and sections, collapse/expand, empty guidance, campus filtering, call cancellation, confirmed dialing and dialing failure. Existing service and hook tests remain in place.

## Demo sequence

Home -> Fire -> collapse and expand an instruction -> Call for Help -> switch campuses -> select a contact -> show confirmation -> Cancel -> Back.

Location is explicitly shown as "Location not set". Automatic location, location editing, onboarding, authentication and content editing are outside this three-screen skeleton. The BU wordmark and vector icons are approximations of the supplied screenshots, not exported Figma assets.
