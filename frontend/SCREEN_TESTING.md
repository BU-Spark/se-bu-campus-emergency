# Skeleton screen testing

Run commands from `frontend/` on branch `codex/frontend-building-integration`.

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

## Building and AED flow

- Deny location permission: Home and emergency guidance must still work. Use Edit or Choose building to open the directory.
- Search by name, address, or campus code. Selecting a row is a draft; Cancel must leave the previous building unchanged.
- Save a building: its name and address appear in the shared header, explicitly labeled Manually selected.
- Open Find an AED: the selected building's AED details are expanded first, with floor, room, location note, and a directions link.
- Browse another campus or search another building without changing the saved building.
- Choose a Medical Campus building and open Contacts: the Medical Campus tab should be selected. Guidance should also use the selected campus for its contact cards.
- Clear the manual selection: the header returns to GPS status. Selection lasts for the current app session, not across restarts.
- Test empty results, directory request failure, and retry. A building with no AED entries must say so rather than imply an AED exists.

## Real-device acceptance record (not yet executed by the coding agent)

Record device model, OS, Expo Go version, date, and pass/fail separately for iOS and Android:

| Check | iOS | Android |
| --- | --- | --- |
| Home, seven scenarios, Back navigation | Pending | Pending |
| Guidance expansion and complete content | Pending | Pending |
| Location denied and manual building selection | Pending | Pending |
| Selected building AEDs and directions | Pending | Pending |
| Call confirmation and Cancel / Android Back | Pending | Pending |
| Confirm opens dialer with a controlled, non-emergency test number | Pending | Pending |
| Small screen, large text, keyboard, portrait/landscape | Pending | Pending |

Never place real emergency calls for testing. Use a dedicated test fixture with a number you control
to check native dialer integration; do not change production emergency contact numbers.

GPS currently identifies a campus, not an exact building. Offline caching, onboarding, authentication,
and content editing are not implemented. No general building-resource table is supplied: this UI shows
available AEDs, directions, and campus contacts. The BU wordmark and vector icons approximate the
supplied Figma screenshots; exact exported assets were not provided.
