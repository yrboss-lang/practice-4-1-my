const user = {
  id: 1, name: "Аня",
  role: "admin", age: 25,
};
 
const { role:roleName, name : userName, ...restOfUser } = user;
 
//console.log(userName);
//console.log(restOfUser);

// Обычная деструктуризация: имя известно заранее
const { name, age } = user;

// Вычисляемое имя: ключ хранится в переменной
const keyToRemove = "role";
const { [keyToRemove]: _, ...rest } = user;
console.log(rest);
