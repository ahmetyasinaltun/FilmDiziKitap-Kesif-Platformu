const { Activity, Library, Content, User } = require('../models');

exports.addToLibrary = async (req, res) => {
  const { contentId, status } = req.body; 
  const userId = req.user.id;

  try {
    
    
    
    
    
    let content;
    if (req.body.apiId && req.body.type) {
        const apiIdStr = req.body.apiId.toString();
        content = await Content.findOne({ where: { apiId: apiIdStr, type: req.body.type } });
        if (!content) {
             
             content = await Content.create({
                 apiId: apiIdStr,
                 type: req.body.type,
                 title: req.body.title || 'Unknown',
                 poster: req.body.poster
             });
        }
    } else {
        return res.status(400).json({ message: 'Content info required' });
    }

    const [entry, created] = await Library.findOrCreate({
      where: { UserId: userId, ContentId: content.id },
      defaults: { status }
    });

    if (!created) {
      entry.status = status;
      await entry.save();
    }

    
    await Activity.create({
      UserId: userId,
      ContentId: content.id,
      type: 'status_change',
      detail: `Changed status to ${status}`
    });

    res.json({ message: 'Library updated', entry });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating library' });
  }
};

exports.addReview = async (req, res) => {
  const { apiId, type, title, poster, rating, comment } = req.body;
  const userId = req.user.id;

  try {
    
    let content = await Content.findOne({ where: { apiId: apiId.toString(), type } });
    if (!content) {
        content = await Content.create({
            apiId: apiId.toString(),
            type,
            title: title || 'Unknown',
            poster
        });
    }

    
    const activity = await Activity.create({
      UserId: userId,
      ContentId: content.id,
      type: comment ? 'review' : 'rating',
      rating: rating ? parseInt(rating) : null,
      detail: comment
    });

    
    
    const allRatings = await Activity.findAll({
        where: { ContentId: content.id, rating: { [require('sequelize').Op.ne]: null } }
    });
    
    if (allRatings.length > 0) {
        const sum = allRatings.reduce((acc, curr) => acc + curr.rating, 0);
        content.rating = (sum / allRatings.length).toFixed(1);
        await content.save();
    }

    res.json(activity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding review' });
  }
};

exports.getContentActivities = async (req, res) => {
    const { apiId, type } = req.query;
    try {
        const content = await Content.findOne({ where: { apiId: apiId.toString(), type } });
        if (!content) {
            return res.json([]); 
        }

        const activities = await Activity.findAll({
            where: { ContentId: content.id, type: ['review', 'rating'] },
            include: [
                { model: User, attributes: ['username', 'avatar'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(activities);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching content activities' });
    }
};

exports.getUserLibrary = async (req, res) => {
    const userId = req.user.id;
    try {
        const library = await Library.findAll({
            where: { UserId: userId },
            include: [Content]
        });
        res.json(library);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching library' });
    }
};

exports.getRecentActivities = async (req, res) => {
    try {
        const whereClause = {};
        
        
        
        
        
        
        
        if (req.user && req.user.id) {
             whereClause.UserId = { [require('sequelize').Op.ne]: req.user.id };
        }

        const activities = await Activity.findAll({
            where: whereClause,
            include: [
                { model: User, attributes: ['id', 'username', 'avatar'] },
                { model: Content, attributes: ['title', 'type', 'poster', 'apiId'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: 20
        });
        res.json(activities);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching activities' });
    }
};

exports.getFeed = async (req, res) => {
    try {
        const currentUser = await User.findByPk(req.user.id, {
            include: [{ model: User, as: 'Following', attributes: ['id'] }]
        });
        
        const followingIds = currentUser.Following.map(u => u.id);
        

        const activities = await Activity.findAll({
            where: { UserId: followingIds },
            include: [
                { model: User, attributes: ['id', 'username', 'avatar'] },
                { model: Content, attributes: ['title', 'type', 'poster', 'apiId'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: 20
        });
        res.json(activities);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching feed' });
    }
};

exports.getMyActivities = async (req, res) => {
    try {
        const activities = await Activity.findAll({
            where: { UserId: req.user.id },
            include: [
                { model: User, attributes: ['id', 'username', 'avatar'] },
                { model: Content, attributes: ['title', 'type', 'poster', 'apiId'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: 20
        });
        res.json(activities);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching my activities' });
    }
};
