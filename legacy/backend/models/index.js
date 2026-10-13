const { sequelize } = require('../config/db');
const User = require('./User');
const Content = require('./Content');
const Activity = require('./Activity');
const Library = require('./Library');
const Follow = require('./Follow');
const List = require('./List');




User.hasMany(Activity, { foreignKey: 'UserId' });
Activity.belongsTo(User, { foreignKey: 'UserId' });


Content.hasMany(Activity, { foreignKey: 'ContentId' });
Activity.belongsTo(Content, { foreignKey: 'ContentId' });


User.hasMany(Library, { foreignKey: 'UserId' });
Library.belongsTo(User, { foreignKey: 'UserId' });


Content.hasMany(Library, { foreignKey: 'ContentId' });
Library.belongsTo(Content, { foreignKey: 'ContentId' });


User.hasMany(List, { foreignKey: 'UserId' });
List.belongsTo(User, { foreignKey: 'UserId' });


List.belongsToMany(Content, { through: 'ListItems' });
Content.belongsToMany(List, { through: 'ListItems' });


User.belongsToMany(User, { as: 'Followers', through: Follow, foreignKey: 'followingId', otherKey: 'followerId' });
User.belongsToMany(User, { as: 'Following', through: Follow, foreignKey: 'followerId', otherKey: 'followingId' });

module.exports = {
  sequelize,
  User,
  Content,
  Activity,
  Library,
  Follow,
  List
};
