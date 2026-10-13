const { User } = require('../models');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Profil alınamadı' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const { username, bio } = req.body;

    if (username) user.username = username;
    if (bio) user.bio = bio;
    
    if (req.file) {
        
        
        const protocol = req.protocol;
        const host = req.get('host');
        user.avatar = `${protocol}://${host}/uploads/${req.file.filename}`;
    } else if (req.body.avatar) {
        
        user.avatar = req.body.avatar;
    }

    await user.save();

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Profil güncellenemedi' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'email'] },
      include: [
          { model: User, as: 'Followers', attributes: ['id'] },
          { model: User, as: 'Following', attributes: ['id'] },
          { model: require('../models').Library, attributes: ['id'] }
      ]
    });
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    
    
    let isFollowing = false;
    if (req.user && req.user.id) {
        const currentUser = await User.findByPk(req.user.id);
        if (currentUser) {
            isFollowing = await currentUser.hasFollowing(user);
        }
    }

    const userData = user.toJSON();
    userData.followersCount = user.Followers.length;
    userData.followingCount = user.Following.length;
    userData.libraryCount = user.Libraries.length;
    
    
    delete userData.Followers;
    delete userData.Following;
    delete userData.Libraries;

    res.json({ ...userData, isFollowing });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Hata oluştu' });
  }
};

exports.followUser = async (req, res) => {
  try {
    if (req.user.id == req.params.id) return res.status(400).json({ message: 'Kendinizi takip edemezsiniz' });
    
    const userToFollow = await User.findByPk(req.params.id);
    const currentUser = await User.findByPk(req.user.id);

    if (!userToFollow) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

    await currentUser.addFollowing(userToFollow);
    res.json({ message: 'Takip edildi' });
  } catch (error) {
    res.status(500).json({ message: 'İşlem başarısız' });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = await User.findByPk(req.params.id);
    const currentUser = await User.findByPk(req.user.id);

    if (!userToUnfollow) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

    await currentUser.removeFollowing(userToUnfollow);
    res.json({ message: 'Takipten çıkıldı' });
  } catch (error) {
    res.status(500).json({ message: 'İşlem başarısız' });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'Followers',
        attributes: ['id', 'username', 'avatar', 'bio']
      }]
    });
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    res.json(user.Followers);
  } catch (error) {
    res.status(500).json({ message: 'Takipçiler alınamadı' });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'Following',
        attributes: ['id', 'username', 'avatar', 'bio']
      }]
    });
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    res.json(user.Following);
  } catch (error) {
    res.status(500).json({ message: 'Takip edilenler alınamadı' });
  }
};

exports.createList = async (req, res) => {
  try {
    const { name } = req.body;
    const list = await require('../models').List.create({
      name,
      UserId: req.user.id
    });
    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Liste oluşturulamadı' });
  }
};

exports.getUserLists = async (req, res) => {
  try {
    const lists = await require('../models').List.findAll({
      where: { UserId: req.params.id },
      include: [{ model: require('../models').Content }]
    });
    res.json(lists);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Listeler alınamadı' });
  }
};

exports.addContentToList = async (req, res) => {
    const { listId } = req.params;
    const { apiId, type, title, poster } = req.body;
    const userId = req.user.id;

    try {
        const List = require('../models').List;
        const Content = require('../models').Content;

        
        const list = await List.findOne({ where: { id: listId, UserId: userId } });
        if (!list) {
            return res.status(404).json({ message: 'Liste bulunamadı veya erişim izni yok' });
        }

        
        let content = await Content.findOne({ where: { apiId: apiId.toString(), type } });
        if (!content) {
            content = await Content.create({
                apiId: apiId.toString(),
                type,
                title: title || 'Unknown',
                poster
            });
        }

        
        await list.addContent(content);

        res.json({ message: 'İçerik listeye eklendi' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'İçerik listeye eklenemedi' });
    }
};

exports.removeContentFromList = async (req, res) => {
    const { listId, contentId } = req.params;
    const userId = req.user.id;

    try {
        const List = require('../models').List;
        const Content = require('../models').Content;

        const list = await List.findOne({ where: { id: listId, UserId: userId } });
        if (!list) {
            return res.status(404).json({ message: 'Liste bulunamadı veya erişim izni yok' });
        }

        const content = await Content.findByPk(contentId);
        if (!content) {
            return res.status(404).json({ message: 'İçerik bulunamadı' });
        }

        await list.removeContent(content);
        res.json({ message: 'İçerik listeden kaldırıldı' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'İşlem başarısız' });
    }
};
