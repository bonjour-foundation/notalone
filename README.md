# NotAlone

The app that won't leave you alone.

## Getting Started

Many people who are alone or see their mobility restricted depend on support: housework, care, listening, shopping, taking out rubbish. Being alone can affect the mood. Family and friends are worried. Volunteers want to help.

NotAlone makes it easy for those in need to organize themselves with relatives, friends and helpers and to keep them up to date.

## Run the project locally

Make sure you have a recent version of [Node.js installed](https://nodejs.org/en/) (LTS recommended).

This application is an [Ionic](https://ionicframework.com/) + [Angular](https://angular.io/) + [Cordova](https://cordova.apache.org/) project.

Head over to your terminal and run the following command:

```
git clone https://github.com/bonjour-foundation/notalone
cd notalone
npm ci
npm run start
```
## Useful dev commands

Cordova
```
npx ionic cordova requirements   

```

Use Java version 11: 
- setup jenv
    https://www.baeldung.com/jenv-multiple-jdk#:~:text=jEnv%20supports%20three%20types%20of,of%20the%20global%20JDK%20version.


Run on ios after build
```
native-run ios --app platforms/ios/build/emulator/NotAlone.app
native-run ios --app platforms/ios/build/emulator/NotAlone.app --target 0522FF7E-CFD7-4A1B-A951-B7AB18F607DF
```

## License

This application is released under the [GNU Affero General Public License](LICENSE). See [COPYING](./COPYING) for more details.

All artwork is licensed under the Creative Commons License [CC BY-NC-SA](https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode) by [Bonjour Foundation](https://bonjour.help/).

The Bonjour name and logo are registered trademarks of [Bonjour Foundation](https://bonjour.help/).
