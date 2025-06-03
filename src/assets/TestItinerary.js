export const TestItinerary = {
    "_id": 0,
    "startDate": "2025-05-25",
    "endDate": "2025-05-26",
    "duration": 1,
    "title": "北京一日游",
    "isShared": true,
    "description": "北京一日游",
    "destinations": ["故宫"],
    "itineraryDays": [{
        "date": "2025-05-25",
        "activities": [{
            "title": "测试活动",
            "timeStart": "00:00",
            "timeEnd": "23:59",
            "location": "测试地点",
            "description": "测试活动描述",
        },],
    },],
    "totalBudget": 0,
    "createdBy": "测试用户",
    "createdAt": "2025-05-25 00:00",
    "updatedAt": "2025-05-25 23:59",
    "collaborators": [{
        "username": "测试用户",
        "email": "test@qq.com"
    },],
    "checklist": [{
        "name": "测试清单项目",
        "checked": "false",
    },],
    "preferences": {
        "pacePreference": "relaxed",
        "accommodationType": "budget",
        "transportationType": "public",
        "activityPreferences": ["sightseeing", "culture"],
        "specialRequirements": "测试需求",
    },
}