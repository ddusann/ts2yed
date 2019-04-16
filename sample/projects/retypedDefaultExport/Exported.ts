// tslint:disable
class Base {

};

class Extended extends Base {

}
// tslint:enable

const e: typeof Extended = Extended;
export default e as typeof Base;
