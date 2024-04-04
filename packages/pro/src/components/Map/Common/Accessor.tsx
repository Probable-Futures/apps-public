const Accessor = {
  IDENTITY_FN: (input: any) => input,

  generateAccessor: (field: any) => (object: any) => object[field],

  generateOptionToStringFor: function generateOptionToStringFor(prop: any) {
    if (typeof prop === "string") {
      return this.generateAccessor(prop);
    } else if (typeof prop === "function") {
      return prop;
    }
    return this.IDENTITY_FN;
  },

  valueForOption: (option: any, object: any) => {
    if (typeof option === "string") {
      return object[option];
    } else if (typeof option === "function") {
      return option(object);
    }
    return object;
  },
};

export default Accessor;
