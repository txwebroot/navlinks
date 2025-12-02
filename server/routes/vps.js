import express from 'express';
import * as vpsService from '../services/vpsService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware to ensure authentication
router.use(authenticateToken);

// --- Groups ---

router.get('/groups', async (req, res) => {
    try {
        const groups = await vpsService.getGroups();
        res.json(groups);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/groups', async (req, res) => {
    try {
        const group = await vpsService.createGroup(req.body);
        res.json(group);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/groups/:id', async (req, res) => {
    try {
        const group = await vpsService.updateGroup(req.params.id, req.body);
        res.json(group);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/groups/:id', async (req, res) => {
    try {
        await vpsService.deleteGroup(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Servers ---

router.get('/servers', async (req, res) => {
    try {
        const servers = await vpsService.getServers();
        res.json(servers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/servers/:id', async (req, res) => {
    try {
        const server = await vpsService.getServerById(req.params.id);
        if (!server) return res.status(404).json({ error: 'Server not found' });
        res.json(server);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/servers', async (req, res) => {
    try {
        const server = await vpsService.createServer(req.body);
        res.json(server);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/servers/:id', async (req, res) => {
    try {
        const server = await vpsService.updateServer(req.params.id, req.body);
        res.json(server);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/servers/:id', async (req, res) => {
    try {
        await vpsService.deleteServer(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/servers/check', async (req, res) => {
    try {
        const { ids } = req.body;
        let serversToCheck = [];

        if (ids && Array.isArray(ids) && ids.length > 0) {
            serversToCheck = ids;
        } else {
            const allServers = await vpsService.getServers();
            serversToCheck = allServers.map(s => s.id);
        }

        const results = await Promise.all(serversToCheck.map(id => vpsService.checkServerConnectivity(id)));
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Snippets ---

router.get('/snippets', async (req, res) => {
    try {
        const snippets = await vpsService.getSnippets();
        res.json(snippets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/snippets', async (req, res) => {
    try {
        const snippet = await vpsService.createSnippet(req.body);
        res.json(snippet);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/snippets/:id', async (req, res) => {
    try {
        const snippet = await vpsService.updateSnippet(req.params.id, req.body);
        res.json(snippet);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/snippets/:id', async (req, res) => {
    try {
        await vpsService.deleteSnippet(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Snippet Categories ---

router.get('/snippet-categories', async (req, res) => {
    try {
        const categories = await vpsService.getSnippetCategories();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/snippet-categories', async (req, res) => {
    try {
        const category = await vpsService.createSnippetCategory(req.body);
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/snippet-categories/:id', async (req, res) => {
    try {
        const category = await vpsService.updateSnippetCategory(req.params.id, req.body);
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/snippet-categories/:id', async (req, res) => {
    try {
        await vpsService.deleteSnippetCategory(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
